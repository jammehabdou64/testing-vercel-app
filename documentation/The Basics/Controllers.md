# Controllers

Controllers are classes. One controller per file, under `app/Http/Controllers`. Generate one with `bun jcc make:controller UserController`.

```typescript
import { Controller, Action, Inject, Inertia, Request } from "bun-jcc";

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

  @Action({ params: ["user"] })
  show(user: string) {
    return this.userService.find(user) ?? {};
  }

  @Action()
  async store(request: Request) {
    const body = await request.body();
    return this.userService.create(body);
  }
}
```

`bun-jcc` is the installed package. `Request` and `Response` are the request and response classes. Do not import `Core/` by a relative path.

`@Inject()` marks the class for constructor injection. `@Action()` marks a method the router may call. Both are required for the patterns above. See [Dependency injection](../Architecture%20Concept/Dependency-Injection.md).

---

## Route parameters

`params` names the URI keys, in order, for parameters typed as `string` or `number`.

```typescript
@Action({ params: ["user"] })
show(user: string) {}

@Action({ params: ["post"] })
show(post: number) {}
```

`{post}` becomes `Number(value)`.

---

## Form requests

Type an action argument as your form request. The container builds it from the current request and calls `validateResolved()` before your method runs.

```typescript
@Action()
async store(request: StoreUserRequest) {
  return request.validated();
}
```

Generate the class with `bun jcc make:request StoreUserRequest`. It extends `FormRequest`. See [Validation](./Validation.md).

---

## Returning a response

Return a `Response`, an Inertia render, a model, or a plain object. An object or an array is sent as JSON. A string or a number is sent as that text, so `1` is the string `1`. A method with no return sends an empty response with status 200, or the status set with `res.status()` before the method ends. Throw `HttpException` when you need a status and a message. See [Response](./Response.md) and [Error handling](./Error-handling.md).

---

## Controller middleware

Every controller extends `Controller`. `only` and `except` limit controller middleware to methods.

```typescript
import { Controller } from "bun-jcc";

export class UserController extends Controller {
  constructor() {
    super();
    this.middleware("auth").except("index", "show");
  }
}
```

A parameter typed as a model is loaded with one `find` when the route matched. `missing(() => ...)` on the route handles a miss. `scopeBindings()` looks up a child through the parent relation.

---

## Single action

A class passed directly to `Route.get` is invoked through `__invoke`. Decorate that method with `@Action()` when it needs injection.
