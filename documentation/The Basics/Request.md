# Request

`AppRequest` wraps the fetch `Request` for the current cycle. Inject it into an action, or read it from a route closure as `req`.

```typescript
import { AppRequest } from "../../../Core/Http/Request/Request";

@Action()
async store(request: AppRequest) {
  const body = await request.body();
}
```

The raw fetch request is `request.raw()`.

---

## URL and method

| Method | Returns |
|--------|---------|
| `path()` | Path without the query string |
| `url()` | A `URL` |
| `fullUrl()` | Absolute URL |
| `method()` | Uppercase verb |
| `isMethod("post")` | Verb check |
| `isGet()`, `isPost()`, … | Verb helpers |
| `is(...patterns)` | Path pattern, including `*` |

---

## Input

`body()` reads the body once and caches it. Later calls return the same value. JSON and form bodies become objects. Multipart files become `UploadedFile` instances.

```typescript
const all = await request.all();
const name = await request.input("name");
const email = await request.string("email");
const age = await request.integer("age");
const admin = await request.boolean("admin");
const picked = await request.only(["name", "email"]);
```

`has`, `filled`, and `missing` describe whether a key arrived and whether it is non-empty. `header(name)` reads a header. `bearerToken()` reads `Authorization: Bearer`.

`expectsJson()` and `wantsJson()` look at the `Accept` header. `isInertia()` is true when the request sends `X-Inertia`.

---

## Route parameters

```typescript
const id = request.param("user");
```

Prefer `@Action({ params })` when the value should be a typed argument. See [Controllers](./Controllers.md).

---

## Session, user, cookies

`request.session()` returns the session after `StartSession`. Calling it without that middleware throws.

`request.user()` returns the authenticated user when the auth guard has resolved one. `request.cookie(name)` reads a cookie. Queue a cookie for the response with `request.queueCookie(...)`.

---

## Files

```typescript
const avatar = await request.file("avatar");
```

`UploadedFile` exposes the stored upload. `hasFile("avatar")` checks that a file arrived.

---

## Validation on the request

```typescript
const data = await request.validate({
  email: "required|email",
  name: "required|string|min:2",
});
```

Failure throws `ValidationException`. For a dedicated class, use a form request.

---

## Form requests

`FormRequest` extends `AppRequest`. Generate one with `bun jcc make:request StoreUserRequest`.

```typescript
export class StoreUserRequest extends FormRequest {
  authorize(): boolean {
    return true;
  }

  rules() {
    return {
      email: "required|email",
      name: "required|string|min:2",
    };
  }

  messages() {
    return { "email.required": "Email is required." };
  }
}
```

The container calls `validateResolved()` before the action:

1. `prepareForValidation()`
2. `authorize()` — `false` throws `HttpException` 403, `"This action is unauthorized."`
3. The validator — failure throws `ValidationException`
4. `passedValidation()`

`validated()` returns the data that passed. `validated("email")` returns one field. The body cache is shared with the original request, so the fetch body is read once.

`withValidator(validator)` runs after the validator is built and before `fails()` is checked.
