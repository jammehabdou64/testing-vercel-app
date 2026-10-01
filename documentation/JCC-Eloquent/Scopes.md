# Scopes

## Local scopes

`@Scope` marks a method on the model. The first argument is the query. Call it by that name.

```typescript
import { Model, type ModelQueryBuilder } from "../../../Core/JCC-Eloquent";
import { Scope } from "../../../Core/JCC-Eloquent/Eloquent/Attributes/Scope";

export class User extends Model {
  @Scope
  protected active(query: ModelQueryBuilder<User>) {
    query.where("status", "active");
  }

  @Scope
  protected ofType(query: ModelQueryBuilder<User>, type: string) {
    query.where("type", type);
  }
}

await User.query().active().get();
await User.active().ofType("admin").get();
```

`User.active()` forwards to `User.query().active()`. Extra arguments after the query are yours, as with `ofType`.

Return the query from the method, or return nothing. `undefined` means “keep this query”.

---

## Global scopes

A global scope implements `apply(builder, model)` and runs on every query. Attach it with `@ScopedBy`.

```typescript
import { ScopedBy, type Scope } from "../../../Core/JCC-Eloquent";

class ActiveScope implements Scope {
  apply(builder) {
    builder.where("active", 1);
  }
}

@ScopedBy([ActiveScope])
export class User extends Model {}
```

`withoutGlobalScope` on the builder removes one scope for a single query. Soft deletes register a global scope named `softDeleting`. See [Soft deletes](./SoftDelete.md).
