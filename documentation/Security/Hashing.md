# Hashing

`Hash` hashes passwords with Bun’s password API. The driver comes from `HASH_DRIVER`: `bcrypt`, `argon`, or `argon2id`. `BCRYPT_ROUNDS` sets the bcrypt cost.

```typescript
import { Hash } from "../../../Core/Support/Facades/Hash";

const hashed = await Hash.make(password);
const ok = await Hash.check(password, hashed);

if (await Hash.needsRehash(hashed)) {
  user.password = await Hash.make(password);
  await user.save();
}
```

`isHashed` reports whether a string already looks like a hash. `info` returns the algorithm details Bun exposes. `driver("argon2id")` selects a hasher for one call.

Store the hash. Never store the password. The auth provider’s `attempt` uses `Hash.check` against the user’s password column.

Do not use `Hash` for cookie encryption. That is `APP_KEY` and `Encrypter`. See [Encryption](./Encryption.md).
