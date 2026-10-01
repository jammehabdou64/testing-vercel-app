# Helpers

Shared functions live in `Core/helpers.ts`. They are not globals. Import the ones you use.

```typescript
import { env, dataGet, dataSet } from "../../Core/helpers";

const name = env("APP_NAME", "Javel");
const email = dataGet(user, "profile.email");
dataSet(payload, "profile.email", email);
```

| Function | Behavior |
|----------|----------|
| `env(key, default?)` | `Bun.env[key]`, or the default |
| `dataGet(target, path)` | Read a dotted path |
| `dataSet(target, path, value)` | Write a dotted path |
| `dataForget(target, path)` | Remove a dotted path |
| `normalizeUri(uri)` | Collapse a route path |
| `compileUri(uri)` | Turn `{param}` and `:param` into a matcher |
| `matchesPathPattern(path, pattern)` | `*` path checks, used by CSRF exceptions |
| `isClass(value)` | Whether a value is a constructor |

`Application.config` uses `dataGet` on the config object. Route parameters use `compileUri`.

`requestContext` in `Core/Http/RequestContext.ts` is the async store for the current `AppRequest`. Middleware and `@csrf` read it. Do not call it from the CLI.
