# Eloquent query builder

`User.query()` returns a `ModelQueryBuilder`. It is the query builder from [the database chapter](../Database/Query-Builder.md), and it hydrates rows into models.

```typescript
const users = await User.query()
  .where("active", 1)
  .orderBy("name")
  .get();
```

`User.where(...)` is the same builder, already started.

Static shortcuts such as `find`, `all`, and `create` are documented in [Retrieving models](./Retrieving-Models.md).

---

## Constraints

Every `where*` method on the base builder is available: `where`, `orWhere`, `whereIn`, `whereNull`, `whereBetween`, `whereColumn`, `whereRaw`, `whereExists`.

`where` and `orWhere` also take a function. The function receives the same model builder, so it can call `whereHas` or `has`. `User.where((query) => { ... })` does the same.

```typescript
await User.query()
  .where("votes", ">", 10)
  .whereNull("banned_at")
  .latest()
  .take(20)
  .get();
```

`limit` and `take` set the same clause. `offset` and `skip` do too. `orderByDesc`, `reorder`, `inRandomOrder`, `when`, `unless`, `whereLike`, `whereKey`, and `findMany` are on this builder as well.

`select` limits columns. If you omit the primary key, identity methods have nothing to read.

---

## Relations

`with("posts")` eager-loads a relation onto each model. Local scopes from `@Scope` are methods on this builder: `User.query().active()`. See [Scopes](./Scopes.md).

`withoutGlobalScope(name)` removes one global scope for that query. Soft deletes use the name `softDeleting`.

---

## Writes through the builder

```typescript
await User.query().where("active", 0).update({ active: 1 });
await User.query().where("id", id).delete();
```

`update` and `delete` here are SQL. They do not load models, so observers and `saving` events do not run for those rows. Load a model and call `save` or `delete` when you need the events.
