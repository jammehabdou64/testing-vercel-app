# Strings

`Str` and `Stringable` live in `Core/Str/Str.ts`. Import them. There is no `str()` global.

```typescript
import { Str } from "../../Core/Str/Str";

Str.random(40);
Str.uuid();
Str.ulid();
Str.slug("Javel Framework");
```

The class covers the usual Laravel string helpers that are implemented in that file: limiting, replacing, casing, pluralization, and random identifiers. Open `Core/Str/Str.ts` for the full method list, and `Core/Str/Str.test.ts` for the behavior tests lock in.

`Stringable` is the chainable wrapper. Use `Str` when you want one call.

`bun jcc key:generate` writes `APP_KEY` with `Str.random(32)`.
