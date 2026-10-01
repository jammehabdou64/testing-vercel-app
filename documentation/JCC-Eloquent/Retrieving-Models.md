# Retrieving models

Queries start at the model. `User.query()` is a model query builder. Several methods are also static shortcuts.

```typescript
await User.all();
await User.find(1);
await User.findOrFail(1);
await User.where("email", "ada@example.com").first();
await User.where("email", "ada@example.com").firstOrFail();
await User.count();
```

`find` and `first` return `null` when nothing matches. `findOrFail` and `firstOrFail` throw.

---

## Creating and updating

```typescript
const user = await User.create({ name: "Ada", email: "ada@example.com" });

user.name = "Augusta";
await user.save();

await User.where("id", user.id).update({ name: "Augusta" });
await user.delete();
await User.destroy(user.id);
```

`firstOrCreate` returns the first match or inserts. `updateOrCreate` updates the match or inserts.

`refresh()` reloads the row from the database.

---

## Eager loading

```typescript
const users = await User.with("posts").get();
```

`with` accepts the relation method names. Access them on `user.relations`. A relation that was not loaded throws when you read it, so a missing `with` fails loudly.

---

## Deletes

`delete()` removes the row. Models that extend `SoftDeletes` set `deleted_at` instead. See [Soft deletes](./SoftDelete.md).
