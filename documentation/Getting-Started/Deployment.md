# Deployment

## Process

Production is the same entry as development, without the file watcher:

```bash
bun index.ts
```

`app.listen()` binds `127.0.0.1:8000` unless you pass a port and hostname. Put a reverse proxy in front of that port when the process should not be public itself.

Set `APP_ENV=production` and `APP_DEBUG=false`. A web 500 then shows `Server Error` without the stack or the source. An API 500 is `{ "message": "Server Error" }`. See [Error handling](../The%20Basics/Error-handling.md).

## Application key

Set `APP_KEY` before the first production request. Cookie encryption and the cookie session driver depend on it. The key must stay stable across deploys or existing cookies stop decrypting.

## Assets and compile output

Full production build:

```bash
bun jcc app:build
```

That runs Vite for the client (`public/build/manifest.json`), Vite SSR (`bootstrap/ssr/`), then `tsc` using `tsconfig.app.json` into `build/`. For assets only, use `bun run vite-build` or `bun jcc app:build --skip-typescript`.

When `public/hot` is absent, `@vite` reads the manifest and emits hashed script and CSS tags. Delete `public/hot` on the server so the view engine does not point browsers at a dev server.

Inertia’s asset version is a hash of `public/build/manifest.json`. After a deploy, an open Inertia tab receives `409` and reloads. See [Inertia](../The%20Basics/Inertia.md).

## Database

Run migrations as part of the release, before or as the new process starts:

```bash
bun jcc migrate
```

`migrate` is not destructive. `migrate:fresh` and `db:wipe` drop tables. Do not run those against production data.

## Sessions and cache

`SESSION_DRIVER=file` stores sessions under `storage/framework/sessions`. That directory must be writable and should not be shared across machines. Use `redis` when more than one process serves traffic.

The same applies to `CACHE_STORE=file`. Prefer `redis` or `database` when the cache must be shared.

## Queue

`QUEUE_CONNECTION=sync` runs jobs inside the request. For background work, use `database` or `redis` and run a worker:

```bash
bun jcc queue:work
```

Keep the worker on its own process. Restart it when you deploy new job code.
