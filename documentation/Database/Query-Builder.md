# Query builder

`connection.table(name)` and `db.table(name)` return a `QueryBuilder`. It collects SQL, the grammar compiles it, and the connection runs it. Models use the same builder. See [Eloquent query builder](../JCC-Eloquent/Query-Builder.md).

```typescript
const db = app.resolve<DatabaseManager>("db");

const rows = await db.table("users").where("active", 1).orderBy("name").get();
const first = await db.table("users").where("email", email).first();
```

---

## Where

```typescript
query.where("status", "open");
query.where("votes", ">", 10);
query.where({ active: 1, role: "admin" });
query.orWhere("role", "editor");
query.whereIn("id", [1, 2, 3]);
query.whereNull("deleted_at");
query.whereBetween("age", [18, 30]);
query.whereColumn("updated_at", ">", "created_at");
query.whereRaw("lower(email) = ?", [email]);
```

`where` also takes a callback for a nested group. `orWhere`, `whereNotIn`, `whereExists`, and `whereNotExists` follow the same pattern.

---

## Read

| Method | Returns |
|--------|---------|
| `get()` | All matching rows |
| `first()` | The first row, or `null` |
| `find(id)` | A row by primary key |
| `exists()` | Whether any row matches |
| `count()`, `sum()`, `avg()`, `min()`, `max()` | Aggregates |
| `value` is not required | Use `first()` and read the field |
| `paginate(perPage, page)` | A paginator |

`select`, `selectRaw`, `addSelect`, `distinct`, `join`, `leftJoin`, `groupBy`, `groupByRaw`, `having`, `havingRaw`, `orHaving`, `orderBy`, `orderByDesc`, `orderByRaw`, `reorder`, `inRandomOrder`, `shuffle`, `latest`, `oldest`, `limit`, `take`, `offset`, and `skip` shape the statement. `shuffle` is `inRandomOrder`. `when` and `unless` add clauses only when a value is set. `toSql()` and `getBindings()` show what will run.

---

## Write

```typescript
await db.table("users").insert({ name: "Ada", email: "ada@example.com" });
const id = await db.table("users").insertGetId({ name: "Ada" });
await db.table("users").where("id", id).update({ name: "Augusta" });
await db.table("users").where("id", id).delete();
```

`insert` accepts one row or an array of rows. `insertOrIgnore` skips rows that conflict. `upsert` inserts or updates on a conflict. `truncate()` empties the table.

`chunk(count, async (rows) => {})` walks a large table in pages. `chunkById` and `each` walk by primary key. `cursor()` and `lazy()` yield one row at a time. `simplePaginate` omits the count query. `cursorPaginate(perPage, cursor)` continues after an id.

`clone()` copies the builder. `union` and `unionAll` combine two selects. `lockForUpdate` and `sharedLock` ask the database to lock the rows. SQLite ignores those locks.

`whereDate`, `whereYear`, `whereMonth`, and `whereDay` compare part of a timestamp. `whereJson(column, path, value)` reads a JSON path. `whereJsonContains(column, value)` matches an element of a JSON array.

---

## Expressions

`raw` from `Core/JCC-Eloquent` builds an expression the grammar will not quote:

```typescript
import { raw } from "../../Core/JCC-Eloquent";

query.select(raw("count(*) as aggregate"));
```
