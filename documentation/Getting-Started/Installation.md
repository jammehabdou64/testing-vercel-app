# Installation

## Install dependencies

From the project root:

```bash
bun install
```

Bun reads `.env` automatically. You do not need `dotenv`.

Run `bun install` before `bun jcc` or `bun jcc app:build`. Controllers import `bun-jcc` from `node_modules`. If that link is missing, Bun may load an old cached copy of the package and fail with `Export named 'Controller' not found`.

## Environment

Create a `.env` file. The values below match the defaults in `app/config`:

```dotenv
APP_NAME=Javel
APP_ENV=local
APP_URL=http://127.0.0.1:8000
APP_DEBUG=true
APP_KEY=

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
HASH_DRIVER=bcrypt
MAIL_MAILER=log
```

`APP_KEY` signs encrypted cookies. `bun jcc key:generate` writes a random value into `.env`. Set it before you rely on cookie encryption or the cookie session driver. See [Encryption](../Security/Encryption.md).

## Run the HTTP server

```bash
bun jcc serve
```

That binds `127.0.0.1:5000`. If the port is taken, the server uses the next port. Saving a source file under `app/`, `routes/`, or `Core/` restarts the server. Saving `.env` reloads it without stopping the process.

`bun run dev` is `bun --hot index`, which listens on port 8000.

For the React welcome page, also start Vite:

```bash
bun run watch
```

Vite writes `public/hot` while it is running. The `@vite` directive in `resources/views/app.html` uses that file to load the dev client. See [Frontend](./Frontend.md).

## Database

Point `DB_CONNECTION` at `sqlite`, `mysql`, or `pgsql`, then:

```bash
bun jcc migrate
bun jcc db:seed
```

See [Migrations](../Database/Migrations.md).

## CLI

```bash
bun jcc
bun jcc route:list
```

`jcc` boots the same application as the HTTP server and parses `process.argv`. The command list is in [CLI](../The%20Basics/CLI.md).
