# Unit testing

A unit test constructs the class and calls it. It does not boot the HTTP kernel.

```typescript
import { expect, test } from "bun:test";
import { Str } from "../../Core/Str/Str";

test("slug lowers and dashes", () => {
  expect(Str.slug("Crème brûlée")).toBe("creme-brulee");
});
```

Confirm other `Str` methods against `Core/Str/Str.test.ts`. The assertion above is the one that file locks in for `slug`.

---

## Validators, hashers, and messages

`Validator.make(data, rules)` needs the validation factory set, which `ValidationServiceProvider` does during `register()`. In a narrow test, instantiate `Validator` the way `Core/Validation` tests do, or boot that one provider.

`Hash.make` and `Hash.check` need the hash manager. Boot `HashServiceProvider`, or call the hasher class directly.

---

## Fakes at the edge

When the class under test sends mail, call `Mail.fake()` after `setMailManager`. Assert with a predicate. The class should not open a socket. The same applies to `Notification.fake()` and `Storage.fake()`.

---

## Containers

If the class asks the container for a dependency, pass the dependency to the constructor in the test. You do not have to boot the whole provider list to prove one method.
