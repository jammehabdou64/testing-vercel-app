# Relationships

Define a relation as a method that returns `hasOne`, `hasMany`, `belongsTo`, `belongsToMany`, `morphOne`, `morphMany`, or `morphTo`.

```typescript
import { Model, type HasMany } from "../../../Core/JCC-Eloquent";

export class User extends Model {
  posts(): HasMany<Post> {
    return this.hasMany(Post);
  }
}

export class Post extends Model {
  author() {
    return this.belongsTo(User);
  }
}
```

`hasMany(Post)` expects `posts.user_id` to point at `users.id`. Pass the foreign key and owner key when the columns differ:

```typescript
return this.hasMany(User, "country_code", "code");
```

`hasMany(Post).where("published", 1)` constrains the relation.

`has("posts")` keeps parents that own at least one row. `has("posts", ">=", 2)` keeps parents with two or more. `whereHas("posts", (query) => query.where("published", 1))` adds constraints inside the relation. `doesntHave` and `whereDoesntHave` are the opposite. `orHas` and `orWhereHas` join that test with `or`. A dotted name such as `posts.comments` walks each relation. `whereHasMorph("comments", ["Post"])` limits a morph relation to those types. `withCount("comments")` adds `comments_count`. `withExists("comments")` adds `comments_exists`. `morphTo` is not supported on `has`.

---

## Loading

```typescript
const users = await User.with("posts").get();
const posts = users[0].relations.posts;
```

`relations` throws if `posts` was not loaded. That is intentional.

---

## Many to many

```typescript
roles() {
  return this.belongsToMany(Role);
}
```

The pivot table is inferred from the two model names. The parent’s key is stored on the pivot and read back when the relation loads.

---

## Morphs

```typescript
comments() {
  return this.morphMany(Comment, "commentable");
}

commentable() {
  return this.morphTo("commentable", { Post, Video });
}
```

`morphMany` writes `commentable_type` as the parent class name and `commentable_id` as the parent key. `morphTo` receives the map of type names to model classes so it can build the right model. Add `morphs("commentable")` to the comments migration.
