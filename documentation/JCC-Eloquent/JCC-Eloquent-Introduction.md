# JCC Eloquent

JCC Eloquent is Javel’s model layer. It sits on the query builder and the same database manager as raw queries. Import it from `Core/JCC-Eloquent`.

```typescript
import { Model } from "../../../Core/JCC-Eloquent";

export class User extends Model {
  static table = "users";
}
```

`DatabaseServiceProvider` calls `Model.useDatabase(manager)` at boot, so models know which connection to use.

There is no mass-assignment guard. `fill` copies the object onto the model. Pass only the fields you mean to write.

---

## What a model can do

| Task | Start here |
|------|------------|
| Table, key, JSON | [Defining a model](./Defining-Model.md) |
| Types on attributes | [Casts](./Casts.md) |
| `find`, `create`, `save` | [Retrieving models](./Retrieving-Models.md) |
| `hasMany`, `belongsTo` | [Relationships](./Relationships.md) |
| `where`, `with` | [Query builder](./Query-Builder.md) |
| Hidden fields | [Attributes](./Attributes.md) |
| `@Scope`, `@ScopedBy` | [Scopes](./Scopes.md) |
| `creating`, `created` | [Observers](./Observer.md) |
| `deleted_at` | [Soft deletes](./SoftDelete.md) |
| Pages of results | [Pagination](./Pagination.md) |

---

## A short example

```typescript
const user = await User.create({ name: "Ada", email: "ada@example.com" });
const found = await User.find(user.id);
const named = await User.where("email", "ada@example.com").first();
```
