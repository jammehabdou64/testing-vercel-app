# Tinker

`bun jcc tinker` boots the application and opens a REPL with that container in scope. Use it to call a model, resolve a service, or inspect config without sending an HTTP request.

```bash
bun jcc tinker
```

The command is `TinkerCommand`. It runs after providers have booted, so the database manager, cache, and the rest of the container exist.

There is no HTTP request inside the REPL. `request.session()` and anything else that reads `requestContext` will throw. Resolve services from the container, or call models directly.

```typescript
await User.query().count()
```

Exit the REPL the way the host runtime expects, usually Ctrl-D.
