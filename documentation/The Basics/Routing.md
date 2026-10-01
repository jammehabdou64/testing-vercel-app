# Routing

Routes map a method and a URI to a closure, a controller method, or an invokable class. `RouteServiceProvider` loads `routes/web.ts` under the `web` middleware group and `routes/api.ts` under the `api` prefix and group. Paths in those files are relative to that prefix.

Import the facade:

```typescript
import { Route } from "../Core/Support/Facades/Route";
```

---

## Basic routes

```typescript
Route.get("/greeting", ({ res }) => {
  return res.text("Hello");
});

Route.post("/users", [UserController, "store"]);
Route.put("/users/{user}", [UserController, "update"]);
Route.patch("/users/{user}", [UserController, "update"]);
Route.delete("/users/{user}", [UserController, "destroy"]);
```

`match` limits the verbs. `any` accepts every verb. `options` registers OPTIONS. The route these return can be chained:

```typescript
Route.match(["get", "post"], "/form", [FormController, "handle"]).name("form");
Route.any("/hook", [HookController, "handle"]);
Route.get("/users/{user}", [UserController, "show"]).whereNumber("user");
Route.get("/files/{path?}", [FileController, "show"]);
Route.fallback([FallbackController, "index"]);
Route.redirect("/old", "/new");
Route.view("/about", "about");
```

`whereNumber`, `whereAlpha`, `whereAlphaNumeric`, `whereUuid`, and `whereIn` are compiled into the route once, so matching stays a single check. `{path?}` makes that segment optional. `fallback` runs only after nothing else matched.

Closures receive `{ req, res }`. Controller methods use `@Action()`. See [Controllers](./Controllers.md).

An invokable controller is the class itself. The router calls `__invoke`.

```typescript
Route.get("/health", HealthController);
```

---

## Parameters

`{user}` and `:user` both capture one path segment.

```typescript
Route.get("/users/{user}", [UserController, "show"]);
```

Read it on the request with `req.param("user")`, or declare it on the action:

```typescript
@Action({ params: ["user"] })
show(user: string) {}
```

A model parameter is loaded for you when the action type-hints a model. The parameter name has to match the route key. `{user}` calls `User.find`. `{user:slug}` calls `where("slug", value)` instead of the primary key.

```typescript
@Action()
show(user: User) {
  return user;
}
```

A missing row is a 404. `missing` on the route answers instead:

```typescript
Route.get("/users/{user}", [UserController, "show"]).missing(() => "missing");
```

`withTrashed()` includes soft-deleted rows. `scopeBindings()` loads a child through the parent relation, so `/users/{user}/posts/{post}` uses `user.posts()`:

```typescript
Route.get("/users/{user}/posts/{post}", [PostController, "show"]).scopeBindings();
```

`Route.model("user", User)` and `Route.bind("user", (id) => ...)` replace the lookup for that parameter name, including when the action types it as `string`.

---

## Groups

```typescript
Route.prefix("admin").middleware("auth").group(() => {
  Route.get("/dashboard", [DashboardController, "index"]);
});
```

`name` on the registrar is a name prefix for the routes inside the group:

```typescript
Route.prefix("admin").name("admin.").group(() => {
  Route.get("/users", [AdminUserController, "index"]);
});
```

`controller` sets the class for string actions in the group:

```typescript
Route.controller(PhotoController).group(() => {
  Route.get("/photos", "index");
  Route.get("/photos/{photo}", "show");
});
```

---

## Resources

```typescript
Route.resource("users", UserController);
Route.apiResource("posts", PostController);
```

`resource` registers the seven REST actions (`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`) and names them `users.index`, `users.show`, and so on. `apiResource` omits `create` and `edit`.

`only`, `except`, `names`, `parameters`, `shallow`, `whereNumber`, and `middlewareFor` live on the pending registration. `singleton` and `apiSingleton` register one resource without an id in the URI. Pass the controller class, not an instance.

```typescript
Route.resource("photos.comments", CommentController).shallow();
Route.singleton("profile", ProfileController);
Route.domain("{account}.example.com").group(() => {
  Route.get("/dashboard", [DashboardController, "index"]);
});
```

---

## Names and URLs

Resource routes are named `users.index`, `users.show`, and so on. Chain `.name("users.show")` on a route, and read it back with `getName()`. `URL.route` calls `Router.route` and fills `{key}`, `{key?}`, and `:key`.

```typescript
import { URL } from "../Core/Support/Facades/URL";

URL.route("users.show", { user: 4 });
URL.to("/users/4");
```

See [URL](./URL.md). `bun jcc route:list` prints every registered route.
