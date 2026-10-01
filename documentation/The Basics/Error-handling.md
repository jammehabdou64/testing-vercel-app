# Error handling

The HTTP kernel catches exceptions that escape a route or middleware.

A web request receives an HTML page. An API route, or a request that asks for JSON, receives JSON. A path under `/api`, a route in the `api` group, or an `Accept: application/json` header selects JSON.

| Exception | Status | JSON body |
|-----------|--------|-----------|
| `ValidationException` | `422` | `{ message, errors }` |
| `HttpException` | The exception’s status | `{ message }` |
| Anything else | `500` | `{ message: "Server Error" }` |

`APP_DEBUG=true` adds the exception message to a JSON 500 (`error`) and shows the throwing file, the surrounding lines, and the stack on the HTML page. `APP_DEBUG=false` keeps that out of the response. The HTML page then shows the status and a short label, such as `500` and `Server Error`, or `404` and `Not Found`. A 4xx `HttpException` still shows the message you threw, because that message is for the visitor.

Inertia visits are different for validation only. `HandleInertiaRequests` catches `ValidationException` first, flashes `errors`, and redirects back. Other exceptions still reach the kernel. See [Validation](./Validation.md).

---

## `HttpException`

```typescript
import { HttpException } from "../../../Core/Http/HttpException";

throw new HttpException(404, "User not found.");
```

`FormRequest` throws `HttpException` with status `403` and the message `"This action is unauthorized."` when `authorize()` returns false.

A missing route uses the same page. `/missing` is HTML `404`. `/api/missing` is JSON `{ "message": "Not Found" }`.

---

## Missing views

`View.render` throws when the template file does not exist. That becomes a `500`, because it is not an `HttpException`.

---

## Response events

If you attached `response.on("error")`, a failure while sending the body emits `error` and then `close`. An aborted client emits `close` only. See [Response](./Response.md).
