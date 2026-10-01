# Service container

`Application` extends `Container`. One container holds the app for the life of the process. Providers bind services during `register()`. Controllers and the container resolve them later.

---

## Bindings

```typescript
app.bind("cache", () => new FileStore(path));
app.singleton("db", () => new DatabaseManager(config));
app.instance("db", manager);
```

| Method | Behavior |
|--------|----------|
| `bind(abstract, concrete)` | A new instance on every `resolve` |
| `singleton(abstract, concrete)` | One instance, created on first resolve |
| `instance(abstract, value)` | Store an object that already exists |
| `alias(abstract, target)` | Another name for a binding |
| `resolve(abstract)` | Return the instance |
| `has(abstract)` | Whether a binding exists |
| `forget(abstract)` | Drop it |

`DatabaseServiceProvider` uses `instance("db", manager)` so models and the CLI share one manager.

Constructor injection uses `reflect-metadata` and `design:paramtypes`. A class must be decorated (for example with `@Inject()`) so TypeScript emits those types. See [Dependency injection](./Dependency-Injection.md).

---

## Resolving

```typescript
const db = app.resolve<DatabaseManager>("db");
const user = app.make(UserController);
```

`make(Class)` builds the class and fills its constructor from the container. `callControllerMethod` does the same for an action, and also fills `AppRequest`, `FormRequest`, and route parameters.

---

## The request binding

Each HTTP request replaces the `"Request"` binding with that request’s `AppRequest`. Resolving `AppRequest` inside a request returns the current one. Do not resolve a request from a CLI command; there is none.
