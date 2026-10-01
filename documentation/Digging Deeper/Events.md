# Events

`Event` dispatches a class to every listener registered for it.

```typescript
import { Event } from "../../../Core/Support/Facades/Event";

class UserRegistered {
  constructor(public email: string) {}
}

class SendWelcome {
  handle(event: UserRegistered) {
    console.log(event.email);
  }
}

Event.listen(UserRegistered, SendWelcome);
await Event.dispatch(new UserRegistered("ada@example.com"));
```

`listen` accepts the listener class. The dispatcher constructs it and calls `handle`. `until` stops when a listener returns a non-undefined value. `hasListeners`, `forget`, `push`, and `flush` inspect or clear the map.

---

## Subscribers

A subscriber registers several listeners from one class:

```typescript
class UserEventSubscriber {
  subscribe(events: { listen: typeof Event.listen }) {
    events.listen(UserRegistered, SendWelcome);
  }
}

Event.subscribe(UserEventSubscriber);
```

---

## Queued listeners

`Core/Events/CallQueuedListener.ts` pushes a listener onto the queue instead of running it in the request. The queue connection has to be something the worker processes. See [Queues](./Queues.md).

Model events (`creating`, `saved`, and the rest) are a separate list on the model. See [Observers](../JCC-Eloquent/Observer.md).
