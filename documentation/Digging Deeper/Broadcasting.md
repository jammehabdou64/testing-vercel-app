# Broadcasting

The HTTP server opened by `listen` also accepts a WebSocket at `/broadcasting/socket`. `Broadcast.fake()` records every publish, and `Broadcast.sent()` returns those payloads.

A browser connects, reads its socket id, then subscribes:

```json
{ "event": "connected", "socketId": "..." }
{ "event": "subscribe", "channel": "private-orders.1" }
```

The server answers `{ "event": "subscribed", "channel" }` or `{ "event": "forbidden", "channel" }`. A later publish arrives as `{ "event", "channel", "data" }`.

## Channels

Channel authorization is not registered for you. Create `routes/channels.ts`, then load it from `app/Providers/RouteServiceProvider.ts`. `boot()` already imports `routes/api.ts` and `routes/web.ts`. Add the channels file beside those calls:

```typescript
async routes() {
  await this.mapApiRoutes();
  await this.mapWebRoutes();
  await import("../../routes/channels");
}
```

`routes/channels.ts` holds the callbacks:

```typescript
import { Broadcast } from "bun-jcc";

Broadcast.channel("orders.{id}", (user, id) => user?.id === Number(id));

Broadcast.channel("chat.{id}", ChatChannel);
```

`ChatChannel` implements `join(user, id)`. Return `false` to refuse the socket. `{id}` is the text between the dots.

`new Channel("orders")` is public, so any connection may subscribe to `orders`. `new PrivateChannel("orders.1")` is `private-orders.1`. `new PresenceChannel("chat.1")` is `presence-chat.1`. `new EncryptedPrivateChannel("orders")` is `private-encrypted-orders`. A private or presence name with no callback still allows `private-{Class}.{id}` when the session user is that class and that id.

## Events

```typescript
class OrderShipped {
  constructor(private readonly id: number) {}

  broadcastOn() {
    return new PrivateChannel(`orders.${this.id}`);
  }

  broadcastAs() {
    return "order.shipped";
  }

  broadcastWith() {
    return { id: this.id };
  }
}

Broadcast.event(new OrderShipped(1));
Broadcast.event(new OrderShipped(1)).toOthers();
```

`Broadcast.event()` sends on the next turn. `broadcastWhen()` returning `false` drops it. `toOthers()` skips the connection whose id is the current request's `X-Socket-ID` header. `Broadcast.socket()` reads that header.

An anonymous send does not need a class:

```typescript
Broadcast.private("orders.1").as("order.shipped").with({ id: 1 }).send();
Broadcast.presence("chat.1").as("MessageSent").with({ body: "Hello" }).sendNow();
Broadcast.on(new Channel("orders")).as("OrderShipped").with({ id: 1 }).send();
```

`via()` is accepted and stays on this WebSocket.

## Client

Import the browser client from `bun-jcc/echo`. It speaks to `/broadcasting/socket` and uses the same calls as Laravel Echo. The page must be served by this app so the session cookie is sent with the socket.

```typescript
import { Echo } from "bun-jcc/echo";

const echo = new Echo();

echo.channel("orders").listen("OrderShipped", (event) => {
  console.log(event.id);
});

echo.channel("orders").listen(".order.shipped", (event) => {
  console.log(event.id);
});

echo.private(`User.${userId}`).notification((notification) => {
  console.log(notification.type, notification.id);
});

echo.join("chat.1")
  .here((members) => console.log(members))
  .joining((member) => console.log(member))
  .leaving((member) => console.log(member))
  .listenForWhisper("typing", (payload) => console.log(payload));

echo.join("chat.1").whisper("typing", { name: "Ada" });
echo.leave("orders");
```

`listen("OrderShipped")` matches the class name. `listen(".order.shipped")` matches `broadcastAs()`, and the leading dot means the name is exact. `notification` receives `{ ...data, id, type }`.

`echo.socketId()` is the id from the socket's `connected` message. Send it as the `X-Socket-ID` header on the request that calls `toOthers()`. `new Echo({ namespace: "App.Events" })` prefixes `listen("OrderShipped")` the way Laravel Echo does.

