# HTTP client

`Http` sends requests with `fetch`. It does not use Axios.

```typescript
import { Http } from "../../../Core/Support/Facades/Http";

const page = await Http.get("https://example.com/health");
const created = await Http.asJson()
  .withToken(token)
  .post("https://example.com/users", { name: "Ada" });

created.throw();
const body = created.json();
```

`withToken`, `withHeaders`, `acceptJson`, and `asJson` return a pending request. The verb methods send it.

| Method | Effect |
|--------|--------|
| `withToken(token)` | `Authorization: Bearer` |
| `withHeaders(headers)` | Extra headers |
| `acceptJson()` | `Accept: application/json` |
| `asJson()` | JSON content type, accept header, and a JSON body |

`get`, `post`, `put`, `patch`, and `delete` return an `HttpResponse`. Private, loopback, and link-local hosts are refused, including after a redirect. `allowRestricted()` permits them for one request. See [Requests](../Security/Requests.md).

| Method | Meaning |
|--------|---------|
| `status` | HTTP status |
| `ok()` | Status is `200` |
| `successful()` | Status is 2xx |
| `json()` | Parsed body. An empty body is `null` |
| `text()` | Raw body |
| `throw()` | Throws when the status is not 2xx |

`GET` and `HEAD` do not send a body. Other verbs JSON-encode an object body.
