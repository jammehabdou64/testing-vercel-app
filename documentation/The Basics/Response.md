# Response

`AppResponse` builds the fetch `Response` for the current request. Inject it, or construct it with `new AppResponse(request)`.

```typescript
@Action()
show(res: AppResponse) {
  return res.json({ ok: true });
}
```

Returning a plain object or an array sends JSON. Returning a string or a number sends that text, so `1` is the string `1`. A method with no return sends an empty response with status 200. `res.status(201)` before that return keeps 201. Use `AppResponse` when you need a header, a cookie, or a redirect.

---

## Body

| Method | Result |
|--------|--------|
| `json(data)` | `application/json` |
| `text(value)` | Plain text |
| `html(value)` | HTML |
| `view(name, data)` | A template from `resources/views` |
| `file(path)` | A file response |
| `download(path, name)` | A file as a download |
| `noContent()` | `204` with an empty body |

```typescript
return res.view("users.index", { users });
```

---

## Status and headers

```typescript
return res.status(201).json({ id });
return res.created({ id });
return res.notFound();
return res.header("X-Request-Id", id).json({ ok: true });
```

Shortcuts: `ok`, `created`, `accepted`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `unprocessable`, `error`.

---

## Redirects

```typescript
return res.redirect("/users");
return res.redirectAway("https://example.com");
return res.route("users.show", { user: 1 });
return res.back("/users").with("status", "Saved.").withInput();
return res.guest("/login");
return res.intended("/dashboard");
```

`redirect` defaults to status `303` and stays on this origin. `redirectAway` is an external `http` or `https` URL. `route` builds the path from a named route. `back` defaults to `302` and uses, in order, the same-origin `Referer`, the previous GET URL stored in the session, then the fallback.

`with` and `withErrors` flash onto the session for the next request. `withInput` flashes the request input as `_old_input`, without `password`, `password_confirmation`, or `current_password`. Read it back with `request.old("name")`. `withFragment("form")` appends `#form`. These need the session.

`guest` stores the current URL as `url.intended` and redirects to the login path. `intended` redirects there once, then forgets it. An intended URL on another origin is replaced by the fallback.

See [Session](./Session.md) and [Inertia](./Inertia.md).

---

## Cookies

```typescript
return res.cookie("theme", "dark").json({ ok: true });
return res.withoutCookie("theme").redirect("/");
```

Cookies queued on the request during middleware are merged onto the outgoing response when the server sends it.

---

## Events

`on` listens for the end of the response. Listeners run only when you attach them before the body is sent.

```typescript
res.on("finish", () => {});
res.on("close", () => {});
res.on("error", (error) => {});
```

A successful response emits `finish`, then `close`. A client cancel emits `close` and does not emit `error` for an abort. See the tests in `Core/Http/tests/response.test.ts`.
