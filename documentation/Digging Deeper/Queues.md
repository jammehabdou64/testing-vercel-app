# Queues

A job is a class that extends `Job`. `handle` does the work. `dispatch` pushes it.

```typescript
import { Job } from "../../../Core/Queue/Job";

export class SendWelcome extends Job {
  constructor(public email: string) {
    super();
  }

  async handle() {
    await Mail.to(this.email).send(new WelcomeMail());
  }
}

await SendWelcome.dispatch("ada@example.com");
await dispatch(SendWelcome, "ada@example.com");
```

`Job.dispatch` and the global `dispatch` helper do the same thing. Both return a pending dispatch. Chain `onQueue`, `onConnection`, and `delay` before it is sent. `dispatch` is registered with the other global helpers when the application is created.

Optional static fields on the job: `module`, `tries`, `backoff`, `queue`, `connection`. `module` is required for jobs the worker must import again in another process.

---

## Connections

`QUEUE_CONNECTION` selects the default in `app/config/queue.ts`.

| Connection | Behavior |
|------------|----------|
| `sync` | Runs `handle` inside the request |
| `null` | Discards the job |
| `database` | Stores a row for `queue:work` |
| `redis` | Stores the payload in Redis |

Create the tables before you use the database driver:

```bash
bun jcc queue:table
bun jcc queue:failed-table
bun jcc migrate
```

---

## The worker

```bash
bun jcc queue:work
bun jcc queue:work database --queue=mail --once
bun jcc queue:work --stop-when-empty
```

`--sleep` is the idle delay. `--tries` overrides the job’s try count. Failed jobs are listed with `queue:failed`, retried with `queue:retry`, and deleted with `queue:flush`.

`Queue` facade methods (`push`, `later`, `size`, `retry`, `failed`, `flush`) talk to the same manager. Prefer `Job.dispatch` in application code so the payload includes the class.

---

## Events

A listener can be queued through `CallQueuedListener`. The listener class still implements `handle`. See [Events](./Events.md).
