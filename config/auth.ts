import { env } from "bun-jcc/helpers";
import { User } from "../app/Models/User";

export const auth = {
  /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | The session guard stores the user id in the session. The eloquent
    | provider loads that user from the users table.
    |
    */

  defaults: {
    guard: env("AUTH_GUARD", "web"),
  },

  guards: {
    web: {
      driver: "session",
      provider: "users",
    },
  },

  providers: {
    users: {
      driver: "eloquent",
      model: User,
    },
  },

  passwords: {
    users: {
      provider: "users",
      table: "password_reset_tokens",
      expire: 60,
    },
  },
};
