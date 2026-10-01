# Custom commands

Commands are classes that extend `Command` in `Core/Jcc-CLI/Command.ts`. One command per file. The CLI constructs them in `Core/Jcc-CLI/index.ts` and registers each `signature` with Commander.

```typescript
import { Command } from "../../Core/Jcc-CLI/Command";

export class GreetCommand extends Command {
  override signature = "greet <name>";
  override description = "Print a greeting";

  async handle(name: string) {
    this.info(`Hello, ${name}`);
  }
}
```

Register it in the `commands([...])` list inside `JccCLI`. Until it is in that list, `bun jcc` will not show it.

---

## Signature

`signature` is Commander syntax.

| Token | Meaning |
|-------|---------|
| `<name>` | Required argument |
| `[connection]` | Optional argument |
| `--once` | Boolean option, declared from `options()` |

`handle` receives the arguments, then the options object as the last parameter.

```typescript
override signature = "queue:work [connection]";

options() {
  return [
    { flags: "--once", description: "Process the next job and stop" },
    { flags: "--sleep <seconds>", description: "Seconds to sleep", defaultValue: 3 },
  ];
}

async handle(connection: string | undefined, options: { once?: boolean; sleep: string }) {}
```

---

## Output and the app

`this.info` writes to stdout. `this.error` writes to stderr. `this.app` is the booted `Application`, set before `handle` runs. Resolve services from it:

```typescript
const cache = this.app.resolve("cache");
```

`boot()` has already run, so providers are ready. There is still no HTTP request.
