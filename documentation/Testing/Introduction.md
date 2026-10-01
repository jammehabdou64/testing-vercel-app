# Testing

Tests use `bun:test`. There is no separate Vitest setup.

```bash
bun test
bun test Core/Http/tests/inertia.test.ts
```

`package.json` does not define a `test` script. Call `bun test` directly. Bun loads `.env` itself.

A test file looks like this:

```typescript
import { expect, test } from "bun:test";

test("the session token is a string", () => {
  expect(typeof token).toBe("string");
});
```

`describe` and `beforeEach` / `afterEach` are available from `bun:test` when a file groups cases.

Framework tests live next to the code they cover: `Core/Http/tests`, `Core/JCC-Eloquent/tests`, `Core/Routing/*.test.ts`. Application tests can follow that pattern under `app/` or a top-level `tests/` directory.

See [Overview](./Testing-Overview.md) for how those tests boot the framework, [Feature testing](./Feature-Testing.md) for HTTP, and [Database testing](./Database-Testing.md) for SQLite.
