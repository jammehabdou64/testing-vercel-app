# Javel — Documentation

Official documentation for **Javel**, a Laravel-shaped web framework for the Bun runtime, written in TypeScript.

Start here. Configuration lives in `app/config`, and environment variables are read with `env()` from `Core/helpers`.

Run commands with `bun jcc`.

---

## Getting started

| Page | Description |
|------|-------------|
| [Introduction](./Getting-Started/Introduction.md) | What Javel is and what it requires |
| [Installation](./Getting-Started/Installation.md) | Install, configure, and run |
| [Configuration](./Getting-Started/Configuration.md) | Config files and environment variables |
| [Directory structure](./Getting-Started/Directory-structure.md) | Where application code lives |
| [Frontend](./Getting-Started/Frontend.md) | Inertia, React, and Vite |
| [Deployment](./Getting-Started/Deployment.md) | Production process and assets |

---

## Architecture

| Page | Description |
|------|-------------|
| [Request lifecycle](./Architecture%20Concept/Request-Lifecycle.md) | Bootstrap, kernel, route, response |
| [Service container](./Architecture%20Concept/Service-Container.md) | Bindings and `resolve()` |
| [Service providers](./Architecture%20Concept/Service-Provider.md) | `register()` and `boot()` |
| [Dependency injection](./Architecture%20Concept/Dependency-Injection.md) | `@Inject()` and `@Action()` |
| [Application architecture](./Architecture%20Concept/Application-Architecture.md) | Controllers, services, and models |

---

## The basics

| Page | Description |
|------|-------------|
| [Routing](./The%20Basics/Routing.md) | Routes, groups, and resources |
| [Controllers](./The%20Basics/Controllers.md) | `@Inject()`, `@Action()`, route params |
| [Middleware](./The%20Basics/Middleware.md) | Global, web, and api stacks |
| [Request](./The%20Basics/Request.md) | `AppRequest` and `FormRequest` |
| [Response](./The%20Basics/Response.md) | JSON, views, redirects, events |
| [API resources](./The%20Basics/Resources.md) | Turn models into JSON |
| [Validation](./The%20Basics/Validation.md) | Rules, the validator, and 422 responses |
| [Session](./The%20Basics/Session.md) | Drivers, flash data, and the CSRF token |
| [Views](./The%20Basics/Views.md) | HTML templates and directives |
| [Asset bundling](./The%20Basics/Asset-bundling.md) | Vite, `@vite`, and React refresh |
| [CSRF protection](./The%20Basics/CSRF-protection.md) | Tokens on web writes |
| [Error handling](./The%20Basics/Error-handling.md) | HTTP and validation exceptions |
| [Inertia](./The%20Basics/Inertia.md) | React pages, shared props, and SSR |
| [Tinker](./The%20Basics/Tinker.md) | Interactive REPL |
| [Custom commands](./The%20Basics/Custom-Commands.md) | Your own `jcc` commands |
| [CLI](./The%20Basics/CLI.md) | Command reference |
| [URL](./The%20Basics/URL.md) | Named routes and absolute URLs |

---

## Database

| Page | Description |
|------|-------------|
| [Introduction](./Database/Database-Introduction.md) | Connections and the database manager |
| [Migrations](./Database/Migrations.md) | Schema builder and `migrate` |
| [Query builder](./Database/Query-Builder.md) | Fluent SQL |
| [Seeding](./Database/Seeding.md) | Seeders and factories |
| [Transactions](./Database/Transactions.md) | `DB.transaction()` |

---

## JCC Eloquent

| Page | Description |
|------|-------------|
| [Introduction](./JCC-Eloquent/JCC-Eloquent-Introduction.md) | The ORM |
| [Defining a model](./JCC-Eloquent/Defining-Model.md) | Tables, keys, and JSON |
| [Casts](./JCC-Eloquent/Casts.md) | Attribute type coercion |
| [Retrieving models](./JCC-Eloquent/Retrieving-Models.md) | `find`, `where`, `create` |
| [Relationships](./JCC-Eloquent/Relationships.md) | hasMany, belongsTo, morph |
| [Query builder](./JCC-Eloquent/Query-Builder.md) | Model queries |
| [Attributes](./JCC-Eloquent/Attributes.md) | `hidden`, `getAttribute`, `setAttribute` |
| [Scopes](./JCC-Eloquent/Scopes.md) | Local and global scopes |
| [Observers](./JCC-Eloquent/Observer.md) | Model lifecycle hooks |
| [Soft deletes](./JCC-Eloquent/SoftDelete.md) | `deleted_at` |
| [Pagination](./JCC-Eloquent/Pagination.md) | `paginate()` |

---

## Security

| Page | Description |
|------|-------------|
| [Authentication](./Security/Authentication.md) | Session guard and `Auth` |
| [Authorization](./Security/Authorization.md) | `Gate` abilities and policies |
| [Hashing](./Security/Hashing.md) | `Hash.make` and `Hash.check` |
| [Encryption](./Security/Encryption.md) | `APP_KEY` and cookie encryption |
| [Requests](./Security/Requests.md) | XSS, SSRF, open redirects, and response headers |

---

## Digging deeper

| Page | Description |
|------|-------------|
| [Cache](./Digging%20Deeper/Cache.md) | Stores and `remember` |
| [Queues](./Digging%20Deeper/Queues.md) | Jobs and `queue:work` |
| [Events](./Digging%20Deeper/Events.md) | Listeners and subscribers |
| [Mail](./Digging%20Deeper/Mail.md) | Mailables and transports |
| [Notifications](./Digging%20Deeper/Notifications.md) | Mail, database, and broadcast channels |
| [Broadcasting](./Digging%20Deeper/Broadcasting.md) | WebSocket events and channel authorization |
| [File storage](./Digging%20Deeper/File-Storage.md) | Disks and `storage:link` |
| [HTTP client](./Digging%20Deeper/HTTP-Client.md) | `Http` and `fetch` |
| [Logging](./Digging%20Deeper/Logging.md) | `Log` levels |
| [Redis](./Digging%20Deeper/Redis.md) | The Redis connection |
| [Helpers](./Digging%20Deeper/Helpers.md) | `env`, `dataGet`, paths |
| [Strings](./Digging%20Deeper/Strings.md) | `Str` |
| [Dates](./Digging%20Deeper/Carbon.md) | `Carbon` |

---

## Testing

| Page | Description |
|------|-------------|
| [Introduction](./Testing/Introduction.md) | `bun test` |
| [Overview](./Testing/Testing-Overview.md) | How framework tests are shaped |
| [Feature testing](./Testing/Feature-Testing.md) | HTTP through `Application.handle` |
| [Unit testing](./Testing/Unit-Testing.md) | Isolated classes |
| [Database testing](./Testing/Database-Testing.md) | SQLite and models |

---

## Quick command reference

```bash
bun run dev                 # HTTP server with reload
bun jcc migrate               # Run migrations
bun jcc db:seed               # Run seeders
bun jcc queue:work            # Process queued jobs
bun jcc tinker                # REPL with the app booted
bun jcc route:list            # List registered routes
```

Full CLI reference: [CLI](./The%20Basics/CLI.md).
