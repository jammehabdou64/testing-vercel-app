# Directory structure

```text
index.ts                 HTTP entry. Calls app.listen()
jcc                      CLI entry. Calls app.handleCommand()
routes/                  web.ts and api.ts
app/
  bootstrap/             Application setup and provider list
  config/                Typed configuration
  Http/Controllers/      Controllers
  Http/Middleware/       Application middleware
  Http/Resources/        API resources
  Models/                Eloquent models
  Providers/             App and route providers
Core/                    Framework
resources/
  views/                 HTML templates
  js/                    Inertia React pages
  css/                   Tailwind entry
public/                  Static files and the Vite hot file
storage/                 File sessions, cache, and disks
database/                SQLite file when you use that driver
documentation/           This manual
```

---

## `app/bootstrap`

`app.ts` creates the application, registers config, middleware, and providers, then exports `app`.

`providers.ts` lists application providers. The framework registers its own providers first, and `RouteServiceProvider` stays last so routes can use them.

---

## `Core`

Framework classes live here, one class per file. Facades are in `Core/Support/Facades`. The HTTP kernel, router, view engine, and Inertia adapter are the pieces a request touches. Eloquent is `Core/JCC-Eloquent`. Schema and migrations are `Core/Database`.

Application code imports the published package, for example `import { Route } from "bun-jcc"`. A relative `Core/` path is not available after the package is installed.

---

## Routes

`RouteServiceProvider` loads `routes/api.ts` inside an `api` prefix and middleware group, then `routes/web.ts` inside the `web` group. Paths in those files are relative to that prefix.

---

## Views and pages

HTML templates are `resources/views/**/*.html`. Dot names map to paths: `users.index` is `resources/views/users/index.html`.

Inertia page components are `resources/js/Pages/**/*.tsx`. `Inertia.render("Welcome")` resolves `./Pages/Welcome.tsx`.
