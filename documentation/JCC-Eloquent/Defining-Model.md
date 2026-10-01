# Defining a model

Generate a model with `bun jcc make:model User`. `bun jcc make:model Post -mcr` also writes the migration and a resource controller. `-s` adds a seeder, `-f` a factory, and `-a` writes all of those. The class extends `Model`.

```typescript
import { Model } from "../../../Core/JCC-Eloquent";

export class User extends Model {
  static table = "users";
  static primaryKey = "id";
}
```

If you omit `table`, the name is inferred from the class. `primaryKey` defaults to `"id"`.

---

## Attributes

Columns are properties. `fill` assigns them. `save` inserts or updates.

```typescript
const user = new User();
user.name = "Ada";
user.email = "ada@example.com";
await user.save();
```

`getAttribute(key)` and `setAttribute(key, value)` read and write one column. `getAttributes()` returns the column bag. `getKey()` returns the primary key.

`fill` and `create` assign every column until the model sets `fillable` or `guarded`. `setAttribute` and `user.name =` are not part of that guard. See [Attributes](./Attributes.md).

---

## JSON

`toJSON()` returns attributes, minus anything listed in `hidden`.

```typescript
export class User extends Model {
  static hidden = ["password"];
}
```

An instance field `hidden = ["password"]` wins over the static list. See [Attributes](./Attributes.md).

---

## Boot

`booted()` runs once per model class. Override it to register listeners. `observe` attaches an observer. See [Observers](./Observer.md).

---

## Relations on the type

`Model` takes an optional relation map so `user.relations.posts` is typed:

```typescript
type UserRelations = { posts: Post[] };

export class User extends Model<UserRelations> {
  posts() {
    return this.hasMany(Post);
  }
}
```

Reading `relations.posts` throws if that relation was never loaded. Call `with("posts")` or load it before you read it.
