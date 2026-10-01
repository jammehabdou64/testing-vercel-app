# Request lifecycle

A request starts in `index.ts`, which calls `app.listen()`. `listen()` boots providers once, then `Bun.serve` handles each HTTP request.

```text
Bun.serve
  → static file in public/, if one matches
  → AppRequest
  → HttpKernel.handle
      → route match
      → middleware pipeline
      → controller or closure
  → AppResponse (or a plain value wrapped as one)
  → fetch Response, with queued cookies merged in
```

---

## Boot

`app/bootstrap/app.ts` builds the application before the first request:

1. `Application.create()` sets the project root.
2. `withConfig(config)` stores `app/config`.
3. `withMiddleware` registers the global list and the `web` group.
4. `providers(providers)` registers the framework providers, then each class in `app/bootstrap/providers.ts`.

`boot()` runs later, inside `listen()` or `handleCommand()`, and calls each provider’s `boot()` once. `RouteServiceProvider.boot()` is what loads `routes/web.ts` and `routes/api.ts`.

---

## The kernel

`HttpKernel.handle` matches the request against the router. A match carries the route’s middleware names. The kernel expands group names (`"web"`, `"api"`) into the classes registered for that group, then runs them as a pipeline. The last step calls the route action.

The current request is stored in `requestContext`, an `AsyncLocalStorage`. Facades and `@csrf` read it from there. Code that runs outside a request does not have a request.

---

## What the action may return

`Application.listen` sends an `AppResponse` as-is. Other return values are normalized into a response. Throw `HttpException` or `ValidationException` to choose the status. See [Error handling](../The%20Basics/Error-handling.md).

---

## CLI

`jcc` uses the same bootstrap and the same `boot()`, then `handleCommand(process.argv)`. There is no HTTP kernel on that path.
