# Validation

Validation is a pipe-separated rule string, a form request, or `request.validate()`. The implementation is `Core/Validation`. The facade is `Validator`.

```typescript
import { Validator } from "../../../Core/Support/Facades/Validator";

const validator = Validator.make(data, {
  email: "required|email",
  name: "required|string|min:2",
});

if (validator.fails()) {
  return validator.errors();
}
```

`Validator.validate(data, rules)` returns the validated data or throws `ValidationException`.

---

## Rules

```typescript
{
  email: "required|email",
  name: "required|string|min:2|max:80",
  age: "nullable|integer|between:1,120",
  role: "required|in:admin,member",
  password: "required|confirmed",
  "items.*.name": "required|string",
}
```

Built-in rules include `required`, `required_if`, `required_unless`, `required_with`, `required_without`, `filled`, `accepted`, `string`, `numeric`, `integer`, `boolean`, `array`, `email`, `url`, `uuid`, `date`, `min`, `max`, `size`, `between`, `in`, `not_in`, `confirmed`, `same`, `different`, `regex`, `unique`, and `exists`.

A closure can be a rule. `Validator.extend(name, fn, message)` adds a named rule for the rest of the process.

---

## Messages and attributes

```typescript
Validator.make(data, rules, {
  "email.required": "Email is required.",
}, {
  email: "email address",
});
```

Form requests expose the same hooks as `messages()` and `attributes()`.

---

## HTTP behavior

`ValidationException` carries status `422` and `errors()` as `Record<string, string[]>`.

The kernel turns that into JSON for an ordinary request:

```json
{ "message": "The given data was invalid.", "errors": { "email": ["Email is required."] } }
```

An Inertia visit does not get that JSON. `HandleInertiaRequests` flashes the errors and redirects back. The next page receives them as the shared `errors` prop. See [Inertia](./Inertia.md).

---

## Form requests

Prefer a form request when the rules belong to one action. `authorize()` returning `false` is `403`, not `422`. See [Request](./Request.md).
