# Authorization

`Gate` answers “may this user do this?”. Define an ability once, then check it from a controller or a form request.

`AuthServiceProvider` installs an empty gate. Add abilities in `AppServiceProvider.boot`, after auth has registered.

```typescript
import { Gate } from "../../../Core/Support/Facades/Gate";

Gate.define("update-post", (user: { id: number }, post: { userId: number }) => {
  return user.id === post.userId;
});
```

The first argument is the user. Everything after it is whatever you pass to `allows`.

---

## Checks

`forUser` binds the user so the ability name comes first:

```typescript
const allowed = await Gate.forUser(user).allows("update-post", post);
const refused = await Gate.forUser(user).denies("update-post", post);
await Gate.forUser(user).authorize("update-post", post);
```

`authorize` throws `HttpException` with status `403` and the message `"This action is unauthorized."` when the ability is denied or was never defined. A missing ability is denied.

Inside a request, `allows`, `denies`, and `authorize` use the authenticated user from `Auth.user`:

```typescript
await Gate.authorize("update-post", post);
```

That form needs a current request. Outside a request, use `forUser`. `check(request, ability, ...args)` takes the request explicitly.

---

## Where it fits

`FormRequest.authorize()` is still the place to refuse one action before validation. `Gate` is the shared ability you call from more than one action.

---

## Policies

A policy groups the checks for one model. Generate it, then register it when the application boots:

```bash
bun jcc make:policy Post --model=Post
```

```typescript
import { Policy } from "../../../Core/Auth/Policy";

export class PostPolicy extends Policy {
  update(user: { id: number }, post: { userId: number }) {
    return user.id === post.userId;
  }

  create(user: { id: number }) {
    return user.id === 1;
  }
}
```

```typescript
Gate.policy(Post, PostPolicy);
```

`allows("update", post)` uses `PostPolicy` when `post` is a `Post`. `allows("create", Post)` calls `create` with the user. A method that only accepts the user does not receive the class. A missing policy method is denied. `before` on the policy runs first: return `true` or `false` to decide, or `null` to continue.

`Gate.before((user, ability, ...args) => ...)` does the same for every check. The first callback that returns `true` or `false` wins.

Inside a controller action, `this.authorize("update", post)` runs the same check for the authenticated user and throws `403` when it is denied.
