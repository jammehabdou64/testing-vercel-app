import { env } from "bun-jcc/helpers";

export const logging = {
  level: env("LOG_LEVEL", "debug"),
};
