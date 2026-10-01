# Application architecture

Javel does not force a folder for every layer. The pieces that already have a place are controllers, form requests, middleware, models, and providers. Put a service in its own file when a controller would otherwise own business rules.

---

## A request’s path

```text
routes/web.ts
  → middleware group "web"
  → UserController
  → UserService or a model
  → AppResponse, Inertia page, or a plain value
```

Controllers stay thin. They read the request, call something that knows the rules, and return a response.

```typescript
import { Controller, Inject, Action, Inertia } from "bun-jcc";

@Inject()
export class UserController extends Controller {
  constructor(private userService: UserService) {
    super();
  }

  @Action()
  async index() {
    return Inertia.render("Users/Index", {
      users: await this.userService.index(),
    });
  }
}
```

---

## Where code goes

| Kind | Location |
|------|----------|
| HTTP action | `app/Http/Controllers` |
| Form request | `app/Http/Requests` (`bun jcc make:request`) |
| API resource | `app/Http/Resources` (`bun jcc make:resource`) |
| Middleware | `app/Http/Middleware` |
| Model | `app/Models` |
| Service | Next to the feature, one class per file |
| Provider | `app/Providers` |
| Config | `app/config` |

Generate the common classes with the CLI. See [CLI](../The%20Basics/CLI.md).

---

## One class, one file

A controller file exports the controller. The service, the form request, and the model each get their own file. That is the rule in `AGENTS.md`, and the generators follow it.

---

## Shared state

Do not store the current user or the current request on a singleton. Read them from `AppRequest` or `requestContext` inside the request. Singletons are for the database manager, the cache store, and other process-wide services.
