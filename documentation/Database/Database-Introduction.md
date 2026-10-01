# Database

Javel talks to SQLite, MySQL, and PostgreSQL through `DatabaseManager` in `Core/JCC-Eloquent`. The `DB` facade uses that manager after `DatabaseServiceProvider` boots. `Model.getDatabase()` is the same object.

```typescript
import { DB } from "../../../Core/Support/Facades/DB";

const users = await DB.table("users").where("active", 1).get();
const rows = await DB.select("select * from users where active = ?", [1]);

await DB.transaction(async () => {
  await DB.table("accounts").where("id", 1).update({ balance: 10 });
});
```

`connection(name)` selects another configured connection. `execute` runs a statement that is not a select. `disconnect` closes connections.

`DatabaseServiceProvider` builds the manager from `app/config/database.ts`, stores it as `"db"`, and calls `Model.useDatabase(manager)`.

---

## Connections

`DB_CONNECTION` selects the default. Typical values are `sqlite`, `mysql`, and `pgsql`.

| Variable | Use |
|----------|-----|
| `DB_CONNECTION` | Default connection name |
| `DB_HOST`, `DB_PORT` | Server |
| `DB_DATABASE` | Database name, or the SQLite file path |
| `DB_USERNAME`, `DB_PASSWORD` | Credentials |
| `REDIS_URL` | Redis, used by cache, sessions, and queues |

```typescript
const connection = DB.connection();
const other = DB.connection("mysql");
```

`connection.table("users")` returns a query builder. See [Query builder](./Query-Builder.md).

---

## Schema

The `Schema` facade changes tables. Migrations are the usual caller. See [Migrations](./Migrations.md).

```typescript
import { Schema } from "../../../Core/Support/Facades/Schema";

await Schema.create("users", (table) => {
  table.id();
  table.string("email").unique();
  table.timestamps();
});
```

`Schema` also has `table`, `drop`, `dropIfExists`, `rename`, and `hasTable`.

---

## CLI

```bash
bun jcc db
bun jcc db:show
bun jcc db:table users
bun jcc migrate
```

`db` opens the database’s own CLI when the driver has one.
