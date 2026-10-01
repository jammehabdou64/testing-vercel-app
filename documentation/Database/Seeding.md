# Seeding

A seeder is a class that extends `Seeder` and implements `run`. Generate one with `bun jcc make:seeder UserSeeder`.

```typescript
import { Seeder } from "../../Core/JCC-Eloquent";
import { User } from "../Models/User";

export class UserSeeder extends Seeder {
  async run() {
    await User.create({ name: "Ada", email: "ada@example.com" });
  }
}
```

`call` runs other seeders from `run`:

```typescript
await this.call(UserSeeder, PostSeeder);
```

---

## Running

```bash
bun jcc db:seed
bun jcc db:seed UserSeeder
```

With no class, the command runs the default seeder the command expects in your database folder. Pass a class name to run one.

---

## Factories

`bun jcc make:factory UserFactory` creates a factory. Extend `Factory` and implement `definition()`.

```typescript
import { Factory } from "../../Core/JCC-Eloquent";
import { User } from "../Models/User";

export class UserFactory extends Factory<User> {
  definition() {
    return {
      name: "Ada",
      email: "ada@example.com",
    };
  }
}
```

`make()` builds an unsaved model. `create()` persists it. `createMany(count)` persists several. Use factories from tests and from seeders when you want more than one hand-written `create`.
