import { env } from "bun-jcc/helpers";

export const session = {
  /*
    |--------------------------------------------------------------------------
    | Session Driver
    |--------------------------------------------------------------------------
    |
    | memory keeps sessions in this process. file stores one JSON document
    | per id. redis uses Bun's Redis client and a TTL. cookie keeps the id
    | in the session cookie and the payload in a second cookie named with
    | that id. EncryptCookies seals the payload. The cookie driver needs APP_KEY.
    |
    */

  driver: env("SESSION_DRIVER", "file"),

  /*
    |--------------------------------------------------------------------------
    | Session Lifetime
    |--------------------------------------------------------------------------
    |
    | Minutes of idle time before the session is discarded.
    |
    */

  lifetime: env("SESSION_LIFETIME", 120),

  files: env("SESSION_FILES", "storage/framework/sessions"),

  redis: env("REDIS_URL", "redis://127.0.0.1:6379"),

  cookie: {
    name: env("SESSION_COOKIE", "jcc_session"),
    path: "/",
    domain: env("SESSION_DOMAIN", ""),
    httpOnly: true,
    secure: env("SESSION_SECURE_COOKIE", false),
    sameSite: "lax",
  },
};
