# Casts

A `casts` map converts column values when a row is loaded and when it is saved. Declare it as a static map, or as a `casts()` method. When both exist, the method wins for a key it names.

```typescript
export class User extends Model {
  static casts = {
    active: "boolean",
    meta: "json",
  };

  protected casts() {
    return {
      email_verified_at: "datetime",
    };
  }
}
```

`boolean` turns database `0` and `1` into `false` and `true`. `json` parses a string on the way out and stringifies an object on the way in. `integer`, `float`, and `string` convert the value both ways. `datetime` and `date` become a `Date` when the row is loaded and an ISO string when it is saved.

Casts change the stored type. A computed value belongs in a get or set accessor. See [Attributes](./Attributes.md).
