# API resources

A resource turns a model into the JSON an action returns. It sits between the model and the response, so the payload can hide a column, rename a field, or include a loaded relation.

Generate one with `bun jcc make:resource UserResource`. The class extends `JsonResource` and lives in `app/Http/Resources`.

```typescript
import { JsonResource } from "bun-jcc";

export class UserResource extends JsonResource {
  override toArray() {
    return {
      id: this.resource.id,
      name: this.resource.name,
      posts: PostResource.collection(this.whenLoaded("posts")),
    };
  }
}
```

Return it from the action. The response is JSON, wrapped in `data`.

```typescript
return new UserResource(user);
return UserResource.collection(await User.all());
```

`whenLoaded("posts")` includes that relation only after `with("posts")` or `load("posts")`. `when(condition, value)` includes a value only when the condition is true. `JsonResource.withoutWrapping()` removes the `data` wrapper.

A collection resource extends `ResourceCollection`. `bun jcc make:resource UserCollection` does that because the name ends in `Collection`. `bun jcc make:resource User --collection` does the same for the name you pass. Set `static collects = UserResource` on the collection when each item should use that resource.

Passing a paginator, such as the object from `paginate()`, adds a `meta` object with `total`, `perPage`, `currentPage`, and `lastPage`.
