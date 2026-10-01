# Configuration

Configuration is TypeScript, not PHP. `app/config/index.ts` gathers the files and `Application.withConfig(config)` stores them at boot.

Read a value from the application:

```typescript
const name = app.config("app.name", "Javel");
const driver = app.config("database.default");
```

`config()` uses dot notation. The second argument is the default when the key is missing.

Inside config files, read the environment with `env()` from `Core/helpers`:

```typescript
import { env } from "../../Core/helpers";

export const app = {
  name: env("APP_NAME", "JCC"),
  key: env("APP_KEY"),
};
```

`env(key, default)` returns `Bun.env[key]` or the default.

---

## Files

| File | Keys | Main environment variables |
|------|------|----------------------------|
| `app.ts` | `name`, `env`, `url`, `debug`, `key` | `APP_NAME`, `APP_ENV`, `APP_URL`, `APP_DEBUG`, `APP_KEY` |
| `auth.ts` | `defaults.guard`, `guards.web`, `providers.users` | `AUTH_GUARD` |
| `database.ts` | `default`, `connections`, `redis` | `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_URL` |
| `session.ts` | `driver`, `lifetime`, `files`, `cookie` | `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_COOKIE`, `SESSION_SECURE_COOKIE` |
| `cache.ts` | `default`, `prefix`, `stores` | `CACHE_STORE`, `CACHE_PREFIX` |
| `queue.ts` | `default`, `connections`, `failed` | `QUEUE_CONNECTION` |
| `mail.ts` | `default`, `from`, `mailers` | `MAIL_MAILER`, `MAIL_HOST`, `MAIL_FROM_ADDRESS`, `RESEND_API_KEY`, `SENDGRID_API_KEY` |
| `filesystems.ts` | `default`, `disks`, `links` | `FILESYSTEM_DISK` |
| `hashing.ts` | `driver`, `bcrypt`, `argon` | `HASH_DRIVER`, `BCRYPT_ROUNDS` |
| `logging.ts` | `level` | `LOG_LEVEL` |
| `logging.ts` | `level` | `LOG_LEVEL` |

Application code can also import the object directly:

```typescript
import { config } from "../config";

const name = config.app.name;
```

The Inertia middleware does this for the shared `name` prop. See [Inertia](../The%20Basics/Inertia.md).

---

## Application key

`APP_KEY` is the secret for [cookie encryption](../Security/Encryption.md). Cookie sessions and the encrypted cookie middleware need it. `bun jcc key:generate` writes a random value into `.env`. Keep that value stable and out of version control.
