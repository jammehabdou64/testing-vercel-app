# Database testing

Eloquent tests use SQLite in memory, or a temporary file, through `DatabaseManager`. They do not share the application’s `.env` database.

```typescript
import { DatabaseManager } from "../../Core/JCC-Eloquent";
import { Model } from "../../Core/JCC-Eloquent";

const db = new DatabaseManager({
  default: "sqlite",
  connections: {
    sqlite: { driver: "sqlite", database: ":memory:" },
  },
});

Model.useDatabase(db);

await db.connection().execute(`
  create table users (
    id integer primary key,
    email text not null
  )
`);
```

The config object is the one `Core/JCC-Eloquent/tests/model.test.ts` uses. Create the tables in the test. Migrations are optional. `Schema.create` works when the schema facade is pointed at the same connection.

---

## Models

```typescript
const user = await User.create({ email: "ada@example.com" });
expect(await User.find(user.getKey())).not.toBeNull();
```

`User` must extend `Model` and use the manager from `Model.useDatabase`. Call that before the first query.

---

## Transactions

`connection.transaction(async () => { ... })` is covered in `Core/JCC-Eloquent/tests/laravel-features.test.ts`. A thrown error rolls the callback back. Assert the row is absent after the rejection.

---

## Cleanup

An in-memory database disappears with the connection. A temporary file should be removed in `afterEach`. Do not point tests at `DB_DATABASE` from `.env` unless you intend to wipe that file.
