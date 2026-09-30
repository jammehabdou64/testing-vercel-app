import { env } from "bun-jcc/helpers";

export const hashing = {
  /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | bcrypt, argon (Argon2i), and argon2id. Passwords are hashed with
    | Bun.password. argon2id is the stronger Argon2 variant.
    |
    */

  driver: env("HASH_DRIVER", "bcrypt"),

  /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | rounds is the cost factor. verify rejects a hash that was not made
    | with bcrypt when checking a password.
    |
    */

  bcrypt: {
    rounds: env("BCRYPT_ROUNDS", 12),
    verify: true,
  },

  /*
    |--------------------------------------------------------------------------
    | Argon Options
    |--------------------------------------------------------------------------
    |
    | Shared by the argon and argon2id drivers. Bun uses sodium, so the
    | thread count written into the hash is always 1.
    |
    */

  argon: {
    memory: 65536,
    threads: 1,
    time: 4,
    verify: true,
  },
};
