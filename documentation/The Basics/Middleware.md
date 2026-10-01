# Middleware

Middleware is a class with `handle({ request, next })`. It runs before the route, and it must call `next()` to continue, or return a response to stop.

```typescript
import type { MiddlewareContext } from "../../../Core/Http/interface";

export class Logger {
  async handle({ request, next }: MiddlewareContext): Promise<Response> {
    console.log(request.method(), request.path());
    return next();
  }
}
```

A function with the same `{ request, next }` shape is also valid.

---

## Registration

`app/bootstrap/app.ts` registers stacks through `withMiddleware`:

```typescript
.withMiddleware((middleware) => {
  middleware.global([Logger]);
  middleware.web([
    HandleInertiaRequests,
    VerifyCsrfToken,
    StartSession,
    AddQueuedCookiesToResponse,
    EncryptCookies,
  ]);
})
```

| Call | Who it wraps |
|------|----------------|
| `global` | Every matched route |
| `web` | Routes in the `web` group (`routes/web.ts`) |
| `api` | Routes in the `api` group (`routes/api.ts`) |
| `alias({ auth: Authenticate })` | A short name for `Route.middleware("auth")` |

The `web` list is inner-first. The kernel runs the **last** class first, so the request reaches the route in this order:

```text
EncryptCookies
  → AddQueuedCookiesToResponse
  → StartSession
  → VerifyCsrfToken
  → HandleInertiaRequests
  → route middleware
  → controller middleware
  → controller
```

Cookies are decrypted before the session starts. CSRF runs only after the session exists. Inertia runs after both, so it can read the session and the user. Route middleware such as `auth` and `verified` runs after the session starts.

---

## Route middleware

```typescript
Route.middleware("auth").get("/account", [AccountController, "show"]);
```

Register the alias in `withMiddleware` before the name will resolve. `Authenticate` in `Core/Auth/Middleware/Authenticate.ts` redirects to `/login` when `Auth.check(request)` is false.

---

## What `handle` returns

Return the `Response` from `next()`, or your own `Response`. The pipeline’s result becomes the HTTP response after the application merges queued cookies.
