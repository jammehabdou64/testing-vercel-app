# Encryption

`Encrypter` in `Core/Cookie/Encrypter.ts` encrypts cookie values with AES-GCM. The key is the SHA-256 of `APP_KEY`, so the secret can be any string. `bun jcc key:generate` writes a random value into `.env`. Set it before encrypted cookies matter:

```dotenv
APP_KEY=a-long-random-string
```

`SessionServiceProvider` calls `Encrypter.use` when `app.key` is set. `EncryptCookies` then encrypts cookies on the way out and decrypts them on the way in. The cookie session driver also needs this key, because the whole session sits in the cookie.

```typescript
import { Encrypter } from "../../../Core/Cookie/Encrypter";

const encrypter = Encrypter.get();
const payload = await encrypter?.encrypt("value");
const plain = payload ? await encrypter?.decrypt(payload) : null;
```

`decrypt` returns `null` when the payload is not valid. A changed `APP_KEY` makes existing cookies fail to decrypt. Generate the key once per environment and keep it stable.

`XSRF-TOKEN` is encrypted when an encrypter exists. `VerifyCsrfToken` decrypts the `X-XSRF-TOKEN` header before comparing it to the session token.

This is cookie encryption, not a general column-encryption helper. Hash passwords with [Hash](./Hashing.md).
