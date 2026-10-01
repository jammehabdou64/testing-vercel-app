# Introduction

Javel is a web application framework for [Bun](https://bun.com). It follows Laravel’s shape: routes, controllers, middleware, a service container, Eloquent-style models, and an Inertia adapter for React. The runtime, package manager, and test runner are Bun.

Use it for a JSON API or a server-rendered React app. The same bootstrap, container, and CLI serve both.

---

## Why Javel

- Laravel-shaped — Routes, middleware groups, form requests, migrations, and models follow conventions you already know.
- Bun-first — `Bun.serve` handles HTTP. Sessions, cache, and the database talk to Bun’s APIs where that is the natural fit.
- TypeScript — Controllers, requests, and models are classes with real types.
- One class per file — Framework and application classes stay in their own files.
- Inertia — The first visit renders an HTML root view. Later visits exchange a page object.

---

## What you get

| Area | Where it lives |
|------|----------------|
| HTTP, routing, views, Inertia | `Core/Http`, `Core/Routing`, `Core/View`, `Core/Inertia` |
| Models and SQL | `Core/JCC-Eloquent`, `Core/Database` |
| Session, CSRF, auth, hashing | `Core/Session`, `Core/Auth`, `Core/Hashing` |
| Cache, queues, mail, files, events | `Core/Cache`, `Core/Queue`, `Core/Mail`, `Core/Filesystem`, `Core/Events` |
| CLI | `jcc` |

---

## Requirements

- Bun 1.0 or newer. This repository is developed against a current Bun release.
- A database when you persist data: SQLite, MySQL, or PostgreSQL. Match `DB_CONNECTION` in your environment.
- Redis is optional. Use it for cache, sessions, or queues when those drivers are set to `redis`.

Node is not required to run the application. Vite’s dev server is started with `bunx --bun vite`.
