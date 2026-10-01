# Attributes

## Hidden

`toJSON()` omits keys listed in `hidden`. A static list applies to every instance. An instance list replaces it.

```typescript
export class User extends Model {
  static hidden = ["password", "remember_token"];
}
```

`getAttributes()` still returns the hidden columns. Hiding only affects JSON.

---

## Reading and writing

```typescript
user.getAttribute("email");
user.setAttribute("email", "ada@example.com");
user.getAttributes();
user.getKey();
```

`fill({ email })` assigns every key you pass until the model lists `fillable` or `guarded`.

## Mass assignment

`static fillable` is the allow-list for `fill`, `create`, `update`, `firstOrCreate`, and `updateOrCreate`. `static guarded` is the block-list. An instance array replaces the static one. A column can be assigned with `setAttribute` or `user.email =` even when `fill` rejects it.

```typescript
export class User extends Model {
  static fillable = ["name", "email"];
}
```

A key in `fillable` is kept. Any other key is dropped. `guarded = ["role"]` drops `role` and keeps the rest. `guarded = ["*"]` with an empty `fillable` rejects the whole `fill` and throws `MassAssignmentException`.

`forceFill({ role: "admin" })` writes the columns anyway. `Model.unguarded(() => user.fill(row))` does the same for the callback. Factories run inside `unguarded`, so a factory can set columns the model does not list. Keys that start with `_` are never mass assigned.

A query such as `User.update(1, { role })` writes the table directly and does not use this guard.

`setRawAttributes(row, exists)` is how the query builder hydrates a model. Application code usually does not call it.

---

## Casts

Column types belong in `casts`. See [Casts](./Casts.md).

## Accessors

`getNameAttribute` runs when the column is read. `setEmailAttribute` runs when it is written. The column name is snake case: `email_verified_at` uses `getEmailVerifiedAtAttribute`. Declare the column with `declare` so a class field does not replace the accessor.

```typescript
export class User extends Model {
  declare name: string;
  declare email: string;

  getNameAttribute(value: string) {
    return value.toUpperCase();
  }

  setEmailAttribute(value: string) {
    return value.toLowerCase();
  }
}
```

`user.name` and `toJSON()` return the get method’s value. The set method’s return value is what gets stored. `getAttributes()` still returns that stored value, so `save` does not persist the display value from the get method. Loading a row does not run the set method.
