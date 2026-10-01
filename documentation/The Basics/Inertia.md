# Inertia

[Inertia](https://inertiajs.com/) keeps routing on the server. A controller returns a component name and props. The first visit is HTML. Later visits are JSON.

The adapter is `Core/Inertia`. The facade is `Inertia`.

```typescript
import { Inertia } from "../../../Core/Support/Facades/Inertia";

return Inertia.render("Welcome", { users });
```

`Welcome` resolves to `resources/js/Pages/Welcome.tsx`. See [Frontend](../Getting-Started/Frontend.md).

---

## Middleware

`app/Http/Middleware/HandleInertiaRequests.ts` extends the framework middleware and is the first entry in the `web` list, so it runs after the session starts.

The base class shares, on every page:

| Prop | Value |
|------|--------|
| `errors` | Validation errors flashed for this request. Always included on partial reloads |
| `auth` | `{ user }` when a user is on the request |
| `flash` | `{ message, status, type }` from the first session flash |
| `_token` | The CSRF token |

The application middleware adds `name` from `config.app.name`.

Override `share(request)` and call `super.share(request)` when you add props. Override `rootView()` to change the HTML template. The default is `app`, which is `resources/views/app.html`.

---

## The page object

```json
{
  "component": "Welcome",
  "props": {},
  "url": "/users",
  "version": "…",
  "flash": {},
  "clearHistory": false
}
```

A browser visit renders the root view. The page JSON sits in `<script data-page="app" type="application/json">`, followed by `<div id="app"></div>`. An `X-Inertia` request receives the same object as JSON, with the `X-Inertia: true` header.

`Inertia.flash("saved", true)` is the page-level `flash` object. The shared `props.flash` is the session flash (`message`, `status`, `type`). They are different bags.

`Inertia.location("https://example.com")` is a normal redirect for a full visit, and `409` with `X-Inertia-Location` for an Inertia visit. `Inertia.clearHistory()` asks the client to drop history.

---

## Partial reloads

Send `X-Inertia-Partial-Component` with the component name, and either:

- `X-Inertia-Partial-Data`: comma-separated prop names to keep
- `X-Inertia-Partial-Except`: prop names to drop

`Inertia.always(value)` marks a prop that survives a partial reload. Errors are wrapped that way.

---

## Asset version

`version()` hashes `public/build/manifest.json`. A `GET` Inertia visit whose `X-Inertia-Version` does not match receives `409` and `X-Inertia-Location`. The client reloads the document. Flash data is kept for that reload.

---

## Redirects and validation

Empty `200` responses on an Inertia visit redirect back. `PUT`, `PATCH`, and `DELETE` that return `302` are rewritten to `303`. A redirect whose target contains `#` becomes `409` with `X-Inertia-Redirect`, unless the request is a prefetch.

Validation on an Inertia visit redirects back and flashes `errors`. A normal visit still receives `422` JSON from the kernel.

---

## Server rendering

SSR is off unless you set `ssr` on the middleware. The default endpoint is `http://127.0.0.1:13714`. The gateway `POST`s `{ page }` to `{url}/render` and expects `{ head, body }`. `body` replaces the root element. `head` replaces `@inertiaHead`. A failed render logs and falls back to the empty `<div id="app">`.

```bash
bun jcc inertia:middleware
bun jcc inertia:start-ssr
bun jcc inertia:check-ssr
bun jcc inertia:stop-ssr
```

`inertia:middleware` writes `app/Http/Middleware/HandleInertiaRequests.ts`. `inertia:start-ssr` runs `bootstrap/ssr/ssr.js` or `bootstrap/ssr/ssr.mjs` with Bun. `--runtime` chooses another executable. The check and stop commands call `/health` and `/shutdown` on the SSR URL. Set `inertia.ssr.url` in config when that URL is not `http://127.0.0.1:13714`.

---

## React refresh

The root view’s `@vite` directive injects the React refresh preamble before the page entry in development. See [Asset bundling](./Asset-bundling.md).
