# Testing overview

A framework test builds the objects it needs and asserts on them. There is no global `RefreshDatabase` helper and no HTTP client wrapper. The patterns below are the ones the suite already uses.

---

## Boot a small application

HTTP tests construct an `Application`, register providers, define routes, and call `application.handle(request)`. See `Core/Http/tests/inertia.test.ts` and `Core/Http/tests/form-request.test.ts`.

```typescript
const application = Application.create(directory);
await application.providers([SessionServiceProvider]);
application.router().middleware("web").get("/users", handler);
const response = await application.handle(new AppRequest(new Request("http://localhost/users")));
```

`Application.create` can take a base path. Tests that touch the filesystem use a temporary directory and delete it in `afterEach`.

---

## Facades in tests

Facades read a manager that a provider normally sets. In a unit test, set that manager yourself:

```typescript
setMailManager(manager);
Mail.fake();
```

The same shape exists for notifications, storage, the event dispatcher, validation, and auth. The setter lives next to the facade (`setMailManager`, `setAuthManager`, and so on). Call it before the facade method, or the facade throws because nothing was bound.

---

## Fakes

| Facade | Capture |
|--------|---------|
| `Mail.fake()` | `Mail.sent()`, `Mail.assertSent(predicate)` |
| `Notification.fake()` | `Notification.sent()`, `Notification.assertSent(Class)` |
| `Storage.fake()` | An in-memory disk |

Fakes do not replace the database. Use SQLite for that. See [Database testing](./Database-Testing.md).

---

## What not to depend on

Do not assume a listening server. `bun test` does not start `index.ts`. Do not read `request.session()` unless the test installed `StartSession` and the request went through the kernel.
