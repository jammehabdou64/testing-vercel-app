# Redis

`Redis` is a thin facade over Bun’s Redis client. `RedisServiceProvider` connects it from `REDIS_URL` in `app/config/database.ts`.

```typescript
import { Redis } from "../../../Core/Support/Facades/Redis";

const redis = Redis.connection();
await redis.set("name", "Ada");
await redis.get("name");
await redis.setex("code", 60, "1234");
await redis.del("name");
```

`connection(name)` selects a named connection when the config defines more than one. `disconnect` closes it. `client()` returns the underlying Bun `RedisClient` for commands the wrapper does not wrap.

Keys are prefixed with `REDIS_PREFIX` when that variable is set.

Cache, session, and queue can each use this connection by setting their driver to `redis`. You do not have to call `Redis` yourself for those. Use the facade when the feature is your own key, a lock, or a list.

`expire` and the list and sorted-set helpers live on `RedisConnection` in `Core/Redis/RedisConnection.ts`.
