# Notifications

A notification chooses channels in `via` and builds a message per channel. Generate one with `bun jcc make:notification InvoicePaid`.

```typescript
import { Notification } from "../../../Core/Notifications/Notification";
import { MailMessage } from "../../../Core/Notifications/MailMessage";

export class InvoicePaid extends Notification {
  via() {
    return ["mail", "database", "broadcast"];
  }

  toMail(notifiable: { email: string }) {
    return new MailMessage().subject("Paid").line("Thank you.");
  }

  toDatabase() {
    return { invoice: 1 };
  }

  toBroadcast() {
    return { invoice: 1 };
  }
}
```

The default `via` is `["mail"]`. Channels that exist are `mail`, `database`, and `broadcast`. A broadcast uses `toBroadcast()`, or `toArray()` when that method is absent. The channel is `private-${class}.${id}` unless `broadcastOn()` or `BroadcastMessage.on(...)` names another one. `Notification.route("broadcast", "public-desk")` sends to that public channel.

A browser connects to `ws://<host>/broadcasting/socket` and sends:

```json
{ "event": "subscribe", "channel": "private-User.1" }
```

`private-User.1` is delivered only when the socket's session user is `User` `1`. `public-desk` is open to any connection, including a guest. A published notification arrives as `{ "event": "notification", "channel", "id", "type", "data" }`.

`Broadcast.fake()` records those payloads and does not open a socket. `Broadcast.sent()` returns them.

---

## Sending

```typescript
import { Notification } from "../../../Core/Support/Facades/Notification";

await Notification.send(user, new InvoicePaid());
await Notification.route("mail", "ada@example.com").notify(new InvoicePaid());
```

`sendNow` skips the queue. A notification with `shouldQueue` true, and a static `module` the worker can import, is pushed onto the queue instead.

The database channel needs the table:

```bash
bun jcc notifications:table
bun jcc migrate
```

The notifiable must be something the channel can address. Mail uses an email. The database channel stores the payload against the notifiable’s key.

---

## Tests

```typescript
Notification.fake();
await Notification.send(user, new InvoicePaid());
Notification.assertSent(InvoicePaid);
```

`sent()` lists the captured notifications. `assertSent` checks the notification class.
