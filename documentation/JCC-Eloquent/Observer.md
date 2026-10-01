# Observers

Observers listen to model events: `saving`, `saved`, `creating`, `created`, `updating`, `updated`, `deleting`, `deleted`.

Name the method after the event.

```typescript
class UserObserver {
  creating(user: User) {
    user.created_at ??= new Date().toISOString();
  }

  deleted(user: User) {
    console.log("deleted", user.getKey());
  }
}
```

Register it with the decorator, or with `observe` from a provider:

```typescript
import { Observer } from "../../../Core/JCC-Eloquent";

@Observer(UserObserver)
export class User extends Model {}

User.observe(UserObserver);
```

`@Observer` records the class. The model attaches it the first time the model boots. `observe` from a provider is the right call when the model might already have booted.

`creating` may be async. The model waits for it.

Builder-level `update()` and `delete()` do not instantiate models, so these methods do not run. Use `save()` and `delete()` on an instance when the observer must see the change.

`booted()` on the model class is a single hook for the same moment, without a separate observer class:

```typescript
export class User extends Model {
  protected static booted() {
    // once per process
  }
}
```
