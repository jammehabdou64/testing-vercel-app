# Soft deletes

Extend `SoftDeletes` instead of `Model`. `delete()` sets `deleted_at` and leaves the row in place. Ordinary queries add `whereNull(deleted_at)`.

```typescript
import { SoftDeletes } from "../../../Core/JCC-Eloquent";

export class User extends SoftDeletes {}
```

The column name defaults to `deleted_at`. Set `static deletedAt` to use another column. Add the column in a migration with `table.softDeletes()`.

---

## Queries

```typescript
await User.all();                 // excludes trashed rows
await User.withTrashed().get();   // includes them
await User.onlyTrashed().get();   // only trashed rows
```

`withTrashed` and `onlyTrashed` drop the `softDeleting` global scope and, for `onlyTrashed`, require the column to be set.

---

## Restore

```typescript
await user.restore();
```

`restore` clears `deleted_at` and saves. A second `delete()` on an already-trashed model keeps the row trashed.

Force-deleting a row permanently is a query that includes trashed models and then deletes at the SQL level. The model `delete()` will not do that.
