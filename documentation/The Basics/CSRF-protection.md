# CSRF protection

`VerifyCsrfToken` runs on the `web` group, after the session has started. It rejects state-changing requests that do not carry the session token.

Safe methods are skipped: `GET`, `HEAD`, and `OPTIONS`.

---

## Sending the token

The session token is `request.session().token()`.

In a view:

```html
<form method="post" action="/users">
  @csrf
  <!-- <input type="hidden" name="_token" value="..."> -->
</form>
```

From JavaScript, send one of:

| Source | Name |
|--------|------|
| Body field | `_token` |
| Header | `X-CSRF-TOKEN` |
| Header | `X-XSRF-TOKEN` |

`X-XSRF-TOKEN` is the `XSRF-TOKEN` cookie, which the middleware sets on the response and which JavaScript can read. When an encrypter is configured, that header is decrypted before it is compared.

Comparison uses `timingSafeEqual` against `session.token()`.

---

## Failure

A mismatch is HTTP `419` with JSON:

```json
{ "message": "CSRF token mismatch." }
```

---

## Excluding paths

Set `VerifyCsrfToken.except` to path patterns. `request.is(...)` matches them, including `*` wildcards. Webhooks that cannot send the token belong there. Everything else on `web` should send it.

---

## Inertia

The shared `_token` prop is the same session token. The Inertia client sends it on visits. See [Inertia](./Inertia.md).
