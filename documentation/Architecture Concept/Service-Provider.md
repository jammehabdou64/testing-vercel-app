# Service providers

A provider connects a framework area to the container. Database, cache, session, auth, and the other framework providers are registered by `Application.providers()` before anything in `app/bootstrap/providers.ts`. That file is only for application providers. `RouteServiceProvider` stays last so routes can use those services.

```typescript
export class DatabaseServiceProvider extends ServiceProvider {
  async register() {
    const manager = new DatabaseManager(this.databaseConfig());
    this.app.instance("db", manager);
    Model.useDatabase(manager);
  }

  async boot() {}
}
```

`register()` binds services. `boot()` runs after every provider has registered, which is the right place to load routes or touch another provider’s binding.

---

## The two phases

`providers()` instantiates each class and calls `register()`. It does not call `boot()` yet.

`Application.boot()` walks the same list and calls `boot()` once. Both `listen()` and `handleCommand()` boot before they do work.

---

## Application providers

`app/Providers/AppServiceProvider.ts` is yours. Bind application services in `register()`.

`app/Providers/RouteServiceProvider.ts` stores the router on the `Route` facade in `register()`, then loads route files in `boot()`:

- `routes/api.ts` inside `prefix("api").middleware("api")`
- `routes/web.ts` inside `middleware("web")`

---

## Adding a provider

1. Create a class that extends `ServiceProvider`.
2. Bind in `register()`. Use `boot()` only when you need other providers’ bindings.
3. Append the class to the array in `app/bootstrap/providers.ts`. Framework providers are already registered.

Keep one class per file.
