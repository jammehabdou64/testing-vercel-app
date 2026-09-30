import { env } from "bun-jcc/helpers";

const url = String(env("APP_URL", "http://localhost")).replace(/\/$/, "");

export const filesystems = {
  /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | local stores private files under storage/app/private. public stores
    | files under storage/app/public. Run `jcc storage:link` so those public
    | files are available from /storage.
    |
    */

  default: env("FILESYSTEM_DISK", "local"),

  disks: {
    local: {
      driver: "local",
      root: "storage/app/private",
      throw: false,
    },
    public: {
      driver: "local",
      root: "storage/app/public",
      url: `${url}/storage`,
      visibility: "public",
      throw: false,
    },
  },

  links: {
    "public/storage": "storage/app/public",
  },
};
