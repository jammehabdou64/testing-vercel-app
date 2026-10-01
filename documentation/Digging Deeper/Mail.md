# Mail

A mailable extends `Mailable` and builds itself in `build()`. Generate one with `bun jcc make:mail WelcomeMail`.

```typescript
import { Mailable } from "../../../Core/Mail/Mailable";

export class WelcomeMail extends Mailable {
  build() {
    this.subject = "Welcome";
    this.html = "<p>Welcome to Javel.</p>";
    return this;
  }
}
```

`view` renders a template instead of a raw HTML string. `text` sets the plain-text part. `with(data)` passes data into the view. `from` overrides the default sender.

---

## Sending

```typescript
import { Mail } from "../../../Core/Support/Facades/Mail";

await Mail.to("ada@example.com").send(new WelcomeMail());
await Mail.html("<p>Hello</p>", (message) => {
  message.to.push({ address: "ada@example.com" });
  message.subject = "Hello";
});
await Mail.raw("Hello", (message) => {
  message.to.push({ address: "ada@example.com" });
});
```

`mailer("log")` picks one mailer for that call. The default is `MAIL_MAILER`.

---

## Mailers

`app/config/mail.ts` defines `log`, `array`, `smtp`, `nodemailer`, `resend`, `sendgrid`, and `twilio`.

| Mailer | Use |
|--------|-----|
| `log` | Writes the message instead of sending it |
| `array` | Keeps messages in memory for tests |
| `smtp` / `nodemailer` | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` |
| `resend` | `RESEND_API_KEY` |
| `sendgrid` | `SENDGRID_API_KEY` |
| `twilio` | `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` |

`MAIL_FROM_ADDRESS` and `MAIL_FROM_NAME` are the default sender.

---

## Tests

```typescript
Mail.fake();
await Mail.to("ada@example.com").send(new WelcomeMail());
Mail.assertSent((message) => message.subject === "Welcome");
```

`sent()` returns the messages captured while faked. `assertSent` throws when no captured message matches the predicate.
