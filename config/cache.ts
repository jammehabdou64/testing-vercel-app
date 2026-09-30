import { env } from "bun-jcc/helpers";

export const cache = {
  /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    |
    | file keeps values on disk. array keeps them for this process. database
    | uses the cache table. redis uses the default Redis connection. null
    | discards every write.
    |
    */

  default: env("CACHE_STORE", "file"),

  prefix: env("CACHE_PREFIX", "jcc_cache_"),

  stores: {
    array: { driver: "array" },
    null: { driver: "null" },
    file: {
      driver: "file",
      path: "storage/framework/cache/data",
    },
    database: {
      driver: "database",
      table: "cache",
      connection: env("DB_CACHE_CONNECTION", ""),
    },
    redis: {
      driver: "redis",
      connection: "default",
    },
  },
};
