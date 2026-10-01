# Feature testing

A feature test sends one HTTP request through `Application.handle` and asserts on the `Response`.

```typescript
import { expect, test } from "bun:test";
import { Application } from "../../Core/Application";
import { AppRequest } from "../../Core/Http/Request/Request";

test("GET /users returns the page", async () => {
  const application = Application.create();
  await application.providers([/* the providers this route needs */]);

  application.router().get("/users", () => ({ ok: true }));

  const response = (await application.handle(
    new AppRequest(new Request("http://localhost/users")),
  )) as Response;

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
```

The test above is the shape. Copy the provider list from a neighboring test when the route needs sessions, CSRF, or Inertia. `Core/Http/tests/inertia.test.ts` is the worked example: it boots `SessionServiceProvider`, puts `HandleInertiaRequests` and `StartSession` on the `web` group, and reads the page JSON back out of the HTML.

---

## Sessions across requests

The file session driver writes a cookie. Read it from `Set-Cookie`, then send it on the next `Request`:

```typescript
const first = await application.handle(new AppRequest(new Request("http://localhost/users")));
const next = await application.handle(
  new AppRequest(new Request("http://localhost/users", {
    headers: { cookie: `jcc_session=${id}` },
  })),
);
```

`Core/Http/tests/inertia.test.ts` has a `cookie()` helper that parses `jcc_session`.

---

## Inertia visits

Set `x-inertia: true` and `x-inertia-version` to receive JSON instead of HTML. A version mismatch returns `409`. Validation on that visit redirects back and flashes `errors`.

---

## CSRF

A `POST` through the `web` group without `_token` or `X-CSRF-TOKEN` returns `419`. Seed the session first so the token exists, then send it. See `Core/Http/tests/csrf.test.ts`.
