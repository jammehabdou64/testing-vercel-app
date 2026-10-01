# Session

The session is available on the request after `StartSession` runs. That middleware is in the `web` group, so `routes/web.ts` has a session and `routes/api.ts` does not unless you add the middleware yourself.

```typescript
const session = request.session();
session.put("name", "Ada");
session.get("name");
session.flash("success", "Saved.");
session.token();
```

---

## Data

| Method | Behavior |
|--------|----------|
| `get(key, default?)` | Read a value |
| `put(key, value)` | Write a value |
| `has(key)` | Whether the key is present |
| `pull(key)` | Read and remove |
| `forget(key)` | Remove |
| `flush()` | Remove everything |
| `all()` | The bag |

`flash(key, value)` keeps the value for the next request only. `reflash()` keeps the current flash for one more request. `now(key, value)` is visible only on this request.

A GET request stores its URL as the previous URL. `res.back()` uses that when the `Referer` is missing. `request.old("name")` reads input flashed by `withInput()`.

The auth guard stores the user id under `login_web_` plus the guard name. Do not overwrite that key.

---

## Identity

`token()` is the CSRF token. `regenerate()` changes the session id. `regenerateToken()` changes the CSRF token. `invalidate()` flushes and regenerates. `Auth.login` regenerates the id so a session fixation attack cannot keep the previous id.

---

## Drivers

`SESSION_DRIVER` selects the store. The default is `file`.

| Driver | Storage |
|--------|---------|
| `file` | `storage/framework/sessions`, or `SESSION_FILES` |
| `memory` | The current process |
| `redis` | `REDIS_URL` |
| `cookie` | The cookie itself, encrypted with `APP_KEY` |

`lifetime` is minutes, from `SESSION_LIFETIME`, default `120`. The cookie name defaults to `jcc_session`.

`memory` disappears when the process exits and is not shared across processes. Use `file` or `redis` for a real app. Use `redis` when more than one machine serves traffic.

---

## Cookie flags

`cookie.httpOnly` is true. `sameSite` is `lax`. `SESSION_SECURE_COOKIE` turns on the secure flag. `SESSION_DOMAIN` sets the domain.

The session cookie is encrypted when `EncryptCookies` runs and `APP_KEY` is set. The `XSRF-TOKEN` cookie is separate: JavaScript can read it, and `VerifyCsrfToken` accepts it. See [CSRF protection](./CSRF-protection.md).
