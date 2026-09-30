import { app } from "./app";
import { auth } from "./auth";
import { cache } from "./cache";
import { database } from "./database";
import { filesystems } from "./filesystems";
import { hashing } from "./hashing";
import { logging } from "./logging";
import { mail } from "./mail";
import { queue } from "./queue";
import { session } from "./session";

export const config = {
  app,
  auth,
  cache,
  database,
  filesystems,
  hashing,
  logging,
  mail,
  queue,
  session,
};
