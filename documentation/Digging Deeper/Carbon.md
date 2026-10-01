# Dates

`Carbon` is exported from `Core/Date`. It is a date helper on top of `date-fns`, with a Laravel-like surface. Import it. It is not a global.

```typescript
import { Carbon } from "../../Core/Date";

const now = Carbon.now();
now.addDays(3);
const parsed = Carbon.parse("2026-09-26");
```

Use it for session lifetimes, job delays, and anything you would otherwise hand-roll with `Date`. The database still stores timestamps as strings or native date columns. Cast or format them at the edge of the model if you want a `Carbon` instance in application code.

The method list is the class in `Core/Date`. Tests next to that folder show the operations that are covered.
