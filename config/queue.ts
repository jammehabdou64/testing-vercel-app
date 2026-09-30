import { env } from "bun-jcc/helpers";

export const queue = {
  /*
    |--------------------------------------------------------------------------
    | Default Queue Connection
    |--------------------------------------------------------------------------
    |
    | sync runs the job before dispatch() resolves. database stores it in
    | the jobs table until `jcc queue:work` reserves it. redis stores it in
    | Redis lists. null discards it.
    |
    */

  default: env("QUEUE_CONNECTION", "sync"),

  connections: {
    sync: { driver: "sync" },
    null: { driver: "null" },
    database: {
      driver: "database",
      table: "jobs",
      queue: "default",
      retryAfter: 90,
    },
    redis: {
      driver: "redis",
      connection: "default",
      queue: "default",
      retryAfter: 90,
    },
  },

  failed: {
    table: "failed_jobs",
  },
};
