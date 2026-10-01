# Dependency injection

Javel resolves constructor and action arguments from the container. Two decorators in `Core/Decorators/ReflectMetadata.ts` mark what can be injected.

---

## `@Inject()`

Put `@Inject()` on a class whose constructor should be filled by the container. The decorator exists so TypeScript emits parameter types.

```typescript
@Inject()
export class UserController {
  constructor(private userService: UserService) {}
}
```

`UserService` must be a class the container can `make` or `resolve`. If it has its own constructor dependencies, decorate that class too.

---

## `@Action()`

Put `@Action()` on every controller method the router calls. The container reads the method’s parameter types and fills them.

| Parameter type | What you receive |
|----------------|------------------|
| `AppRequest` | The current request |
| `AppResponse` | A response bound to that request |
| `FormRequest` subclass | A validated form request |
| `String` or `Number` listed in `params` | A route parameter |
| Any other class | `container.resolve(type)` |

```typescript
@Action({ params: ["user"] })
show(user: string) {
  return this.userService.find(user) ?? {};
}

@Action()
async store(request: StoreUserRequest) {
  const input = request.validated();
  return this.userService.create(input);
}
```

`params` is the list of route keys, in the same order as the string or number arguments. `{user}` in the URI becomes the `user` argument. Numbers are coerced with `Number()`.

Form requests run `validateResolved()` before the action. A failed `rules()` check throws `ValidationException`. A failed `authorize()` throws `HttpException` with status 403. See [Request](../The%20Basics/Request.md).

---

## Closures

Route closures are not decorated. The kernel calls them with `{ req, res }`:

```typescript
Route.get("/health", ({ req }) => {
  return { ok: true, path: req.path() };
});
```

---

## Listeners and commands

Event listeners are plain classes with `handle(event)`. The dispatcher constructs them. Console commands extend `Command` and receive the application through `setApplication` before `handle` runs. They are not resolved as controller actions.
