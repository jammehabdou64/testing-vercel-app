# Logging

`Log` writes to the console. `LOG_LEVEL` is the quietest level that still appears. The default is `debug`.

```dotenv
LOG_LEVEL=info
```

```typescript
import { Log } from "../../../Core/Support/Facades/Log";

Log.debug("sql", { ms: 4 });
Log.info("signed in", { id: user.id });
Log.warning("retrying");
Log.error("payment failed", { id: order.id });
```

Levels, from quietest to loudest: `debug`, `info`, `warning`, `error`. A line below `LOG_LEVEL` is dropped. `warning` goes to `console.warn`, `error` to `console.error`, `info` to `console.info`, and `debug` to `console.debug`.

A context object is appended as JSON. `LogServiceProvider` reads `logging.level` from `app/config/logging.ts`.
