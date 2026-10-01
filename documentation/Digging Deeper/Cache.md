# Cache

`Cache` is a facade over the store selected by `CACHE_STORE`. The default is `file`. Stores in `app/config/cache.ts`: `array`, `null`, `file`, `database`, and `redis`.

```typescript
import { Cache } from "../../../Core/Support/Facades/Cache";

await Cache.put("name", "Ada", 60);
await Cache.get("name");
await Cache.forever("site", "Javel");
await Cache.forget("name");
await Cache.flush();
```

`put` takes a TTL in seconds. `forever` does not expire. `remember(key, seconds, async () => value)` returns the cached value or runs the callback and stores the result. `rememberForever` is the same without a TTL.

| Method | Behavior |
|--------|----------|
| `get`, `many` | Read |
| `put`, `putMany`, `add` | Write. `add` only if the key is missing |
| `pull` | Read and delete |
| `has`, `missing` | Presence |
| `increment`, `decrement` | Numeric keys |
| `store("redis")` | One store, ignoring the default |

`bun jcc cache:table` writes the migration for the `database` store. `bun jcc cache:clear` flushes the default store. `bun jcc cache:forget <key>` removes one key.

`array` lives in the process and disappears on exit. `null` stores nothing. Use `redis` or `database` when several processes must see the same values. `CACHE_PREFIX` prefixes every key.
