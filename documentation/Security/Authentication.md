# Authentication

Authentication is a session guard. The facade is `Auth`. Every method takes the current `AppRequest`, because the guard stores the user id on that request’s session.

```typescript
import { Auth } from "../../../Core/Support/Facades/Auth";

const ok = await Auth.attempt(request, { email, password });
await Auth.login(request, user);
await Auth.logout(request);

const user = await Auth.user(request);
const id = await Auth.id(request);
const signedIn = await Auth.check(request);
```

`attempt` asks the user provider to validate the credentials, then logs the user in. `loginUsingId` loads the user by primary key and logs them in. `guest` is the opposite of `check`.

---

## The session

`login` writes `login_web_` plus the guard name into the session and regenerates the session id. The default guard is `web`, from `AUTH_GUARD` or `app/config/auth.ts`. The provider is the Eloquent `User` model.

`logout` removes that key.

---

## Protecting a route

`Core/Auth/Middleware/Authenticate.ts` redirects to `/login` when `Auth.check(request)` is false. Register it as an alias:

```typescript
middleware.alias({ auth: Authenticate });
```

```typescript
Route.middleware("auth").get("/account", [AccountController, "show"]);
```

---

## Authorization

`Gate` checks named abilities. Define them when the application boots, usually in `AppServiceProvider.boot`. See [Authorization](./Authorization.md).

Policies group those checks per model. See [Authorization](./Authorization.md). A form request can still refuse an action from `authorize()`. See [Request](../The%20Basics/Request.md).

---

## Email verification

`verified` redirects a guest to `/login` and an unverified user to `/email/verify`. Put it on the route after the session starts, which is already true for route middleware.

```typescript
Route.middleware("verified").get("/account", [AccountController, "show"]);
```

`hasVerifiedEmail()` is false until `email_verified_at` is set. Add that nullable timestamp to the users table. `sendEmailVerificationNotification()` mails a temporary signed link named `verification.verify`. The link carries `{id}` and `{hash}` and expires in 60 minutes.

```typescript
Route.get("/email/verify/{id}/{hash}", async ({ req }) => {
  const user = await Auth.user(req);
  if (!user || !(await EmailVerification.verify(req, user))) {
    return response().redirect("/email/verify");
  }
  return response().redirect("/account");
}).name("verification.verify");
```

`EmailVerification.verify` checks the signature, the user id, and a SHA-1 of the email, then sets `email_verified_at`.

---

## Password reset

`bun jcc password:table` writes the `password_reset_tokens` migration. `auth.passwords.users` sets the table and how many minutes a token lasts. The default is 60.

Name a route `password.reset`. `Password.sendResetLink(email)` stores a hashed token and mails the plain token. `Password.reset({ email, token, password })` checks it, hashes the new password, and deletes the token.

```typescript
await Password.sendResetLink("ada@example.com");
await Password.reset({
  email: "ada@example.com",
  token,
  password: "new-secret",
});
```

`passwords.sent` means the mail was queued. `passwords.user` means that email is not registered. `passwords.token` means the token is missing or expired. `passwords.reset` means the password was changed.
