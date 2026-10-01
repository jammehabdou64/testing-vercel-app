# URL

`URL` turns a route name into a path, and a path into an absolute URL. `route` calls `Router.route` on the application router.

`RouteServiceProvider` installs the generator at boot, using `app.url` as the root.

```typescript
import { URL } from "../../../Core/Support/Facades/URL";

URL.route("users.show", { user: 4 });
URL.absolute("users.show", { user: 4 });
URL.to("/users/4");
```

| Method | Result |
|--------|--------|
| `route(name, params)` | The route path, with `{key}` and `:key` replaced |
| `absolute(name, params)` | That path prefixed with `APP_URL` |
| `to(path)` | `APP_URL` plus the path. An `http://` or `https://` path is returned as-is |

A missing name throws `Route [name] not defined.`

Resource routes are named for you: `users.show` is `/users/{user}`. A group `name("admin.")` prefixes names registered inside it. See [Routing](./Routing.md).
