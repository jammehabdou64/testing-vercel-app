# Migrations

A migration is a class that extends `Migration` and implements `up` and `down`. `bun jcc make:migration create_users_table` writes `Schema.create`. `bun jcc make:migration add_votes_to_users_table` writes `Schema.table`. A name containing `_to_`, `_from_`, or `_in_` before the table alters that table. `--create=posts` and `--table=users` choose explicitly.

```typescript
import { Migration } from "../../Core/Database/Migrations/Migration";
import { Schema } from "../../Core/Support/Facades/Schema";

export class CreateUsersTable extends Migration {
  async up() {
    await Schema.create("users", (table) => {
      table.id();
      table.string("name");
      table.string("email").unique();
      table.string("password");
      table.timestamps();
    });
  }

  async down() {
    await Schema.dropIfExists("users");
  }
}
```

`up` applies the change. `down` reverses it. `migrate:rollback` calls `down` for the last batch.

---

## Running

```bash
bun jcc migrate
bun jcc migrate:status
bun jcc migrate:rollback
bun jcc migrate:reset
bun jcc migrate:fresh
```

`migrate` runs migrations that are not in the repository table. `migrate:fresh` drops every table and runs `up` again. Do not point that at a database you need to keep.

Related table stubs:

```bash
bun jcc cache:table
bun jcc queue:table
bun jcc queue:failed-table
bun jcc notifications:table
```

Each writes a migration. Run `bun jcc migrate` afterward.

---

## Columns

`Blueprint` follows Laravel’s column list. The methods you will use most:

```typescript
table.id();
table.string("email");
table.text("body");
table.integer("votes");
table.boolean("active");
table.json("meta");
table.timestamp("published_at").nullable();
table.timestamps();
table.softDeletes();
table.foreignId("user_id").constrained();
```

Also available: `uuid`, `ulid`, `decimal`, `enum`, `date`, `dateTime`, `morphs`, `rememberToken`, and the `drop*` index helpers. Chain `nullable()`, `unique()`, `default(value)`, and `index()` on the column definition the same way Laravel does.

`Schema.table("users", (table) => { ... })` alters an existing table. `table.dropColumn("nickname")` removes a column in that callback.
