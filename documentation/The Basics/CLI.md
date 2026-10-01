# CLI

The binary is `jcc` in the project root. It boots `app/bootstrap/app.ts` and passes `process.argv` to `app.handleCommand`.

```bash
bun jcc
bun jcc migrate
```

`bun jcc` with no command prints Commander’s help. The program name is `jcc`.

---

## Generators

| Command | Creates |
|---------|---------|
| `make:controller <name>` | A controller |
| `make:model <name>` | An Eloquent model. `-m` migration, `-c` controller, `-r` resource controller, `-s` seeder, `-f` factory, `-a` all of those, `--api` an API controller |
| `make:migration <name>` | A migration. `create_posts_table` uses `Schema.create`. `add_votes_to_posts_table` uses `Schema.table`. `--create=<table>` and `--table=<table>` override the name |
| `make:seeder <name>` | A seeder |
| `make:factory <name>` | A model factory |
| `make:request <name>` | A form request |
| `make:resource <name>` | An API resource |
| `make:policy <name>` | A policy |
| `make:mail <name>` | A mailable |
| `make:notification <name>` | A notification |

`make:model Post -mcr` writes the model, a `create_posts_table` migration, and a resource controller. `make:model Post -a` also writes the factory and the seeder. `--api` makes the controller an API resource controller.

`make:resource UserCollection`, or `make:resource User --collection`, writes a collection resource. A name that does not end in `Collection` writes a resource for one model.

---

## Database

| Command | Purpose |
|---------|---------|
| `db [connection]` | Open a database CLI session |
| `db:show` | Show the connection |
| `db:table [table]` | Show one table |
| `db:monitor` | Watch connection count |
| `db:seed [class]` | Run seeders |
| `db:wipe` | Drop tables, views, and types |

---

## Migrations

| Command | Purpose |
|---------|---------|
| `migrate` | Run outstanding migrations |
| `migrate:rollback` | Roll back the last batch |
| `migrate:reset` | Roll back every migration |
| `migrate:fresh` | Drop all tables and migrate again |
| `migrate:status` | Show ran and pending migrations |

`migrate:fresh` and `db:wipe` destroy data.

---

## Cache, queue, storage

| Command | Purpose |
|---------|---------|
| `cache:table` | Migration for the cache table |
| `cache:clear` | Flush the cache |
| `cache:forget <key>` | Forget one key |
| `password:table` | Migration for password reset tokens |
| `queue:table` | Migration for the jobs table |
| `queue:failed-table` | Migration for failed jobs |
| `queue:work [connection]` | Process jobs |
| `queue:failed` | List failed jobs |
| `queue:retry [id]` | Retry one job, or all |
| `queue:flush` | Delete failed jobs |
| `notifications:table` | Migration for the notifications table |
| `storage:link` | Symlink the public disk |
| `key:generate` | Write a random `APP_KEY` into `.env`. `--show` prints one without writing. `--force` replaces a key that is already set in production |
| `route:list` | List routes |
| `inertia:middleware` | Create the Inertia middleware |
| `inertia:start-ssr` | Start the Inertia SSR server |
| `inertia:stop-ssr` | Stop the Inertia SSR server |
| `inertia:check-ssr` | Check that the SSR server is running |
| `tinker` | REPL |

`queue:work` accepts `--queue`, `--once`, `--stop-when-empty`, `--sleep`, and `--tries`.

---

## Application build

```bash
bun jcc app:build
```

Runs, in order:

1. `bunx --bun vite build` — client assets in `public/build/`
2. `bunx --bun vite build --ssr` — Inertia SSR bundle in `bootstrap/ssr/`
3. `bunx tsc -p tsconfig.app.json` — compiled application JavaScript in `build/`

On success, `public/` and `resources/` are copied into `build/public/` and `build/resources/` (including Vite assets under `build/public/build/`). SSR output remains at `bootstrap/ssr/` on the project root unless you copy it separately. The project needs `vite.config.ts` and `tsconfig.app.json`. Use `--skip-vite` or `--skip-typescript` to run only one part. `bun run build` is an alias for the full command.

Installed applications usually compile only `index.ts`, `app/`, and `routes/` in `tsconfig.app.json` and import the framework from `bun-jcc` in `node_modules`. This repository also emits `Core/` because local code imports it directly or through path mapping.

---

## HTTP server

```bash
bun jcc serve
```

The server binds port 5000. When that port is taken it binds 5001, then 5002, and so on. `--port` chooses the first port to try. `--host` defaults to `127.0.0.1`.

Saving a `.ts` or `.js` file under `app/`, `routes/`, `Core/`, or `index.ts` restarts the server. Saving `.env` reloads those values in the running process. You do not restart the server for an environment change.

`bun run dev` still starts `bun --hot index` on port 8000.
