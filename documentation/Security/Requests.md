# Requests

These checks run without a setting. Views escape HTML. The HTTP client refuses local and private hosts. Redirects stay on this origin unless you opt out. Every response gets the browser headers below.

---

## Cross-site scripting

`{{ name }}` is escaped with `Escaper.html`. `{!! html !!}` is raw, so only pass markup you produced. The Inertia page JSON is escaped before it is placed in the script tag, including `<`, `>`, `&`, and the line separators U+2028 and U+2029.

```typescript
import { Escaper } from "../../../Core/Security/Escaper";

const safe = Escaper.html(name);
```

---

## Response headers

`SecureHeaders` sets these when the response does not already have them:

| Header | Value |
|--------|--------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |

Set a header yourself when a response needs a different value. It is not replaced.

---

## Server-side request forgery

`Http` allows `http` and `https` only. It blocks credentials in the URL, loopback, private, link-local, and cloud metadata addresses, and names such as `localhost` and `*.internal`. A hostname is resolved before the request, and a redirect is checked again before it is followed.

```typescript
await Http.get("https://example.com/health");
await Http.allowRestricted().get("http://127.0.0.1:13714/health");
```

`allowRestricted()` is the opt-out for a request you intend to send to your own machine.

---

## Open redirects

`res.redirect("/users")` accepts a path on this origin. A protocol-relative URL, a `javascript:` URL, and an absolute URL on another origin are refused.

```typescript
return res.redirect("/users");
return res.redirectAway("https://example.com");
```

`Route.redirect` uses `redirectAway` when the destination you wrote is an absolute URL. `Inertia.location` does the same. A value that came from the request belongs in `redirect`, which keeps it on this site.
