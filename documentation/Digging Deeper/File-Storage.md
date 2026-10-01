# File storage

`Storage` talks to a named disk. `File` talks to a path on the machine. Most application code should use `Storage`, so a later change of disk does not rewrite every path.

```typescript
import { Storage } from "../../../Core/Support/Facades/Storage";

await Storage.put("notes/today.txt", "Hello");
await Storage.get("notes/today.txt");
await Storage.exists("notes/today.txt");
await Storage.delete("notes/today.txt");
```

`disk("public")` and `drive("public")` select a disk. The default comes from `FILESYSTEM_DISK`.

| Method | Behavior |
|--------|----------|
| `put`, `putFile`, `putFileAs` | Write bytes or an upload |
| `get`, `exists`, `missing` | Read |
| `copy`, `move`, `delete` | Rearrange |
| `url`, `path` | Public URL or absolute path |
| `download`, `response` | HTTP responses |
| `files`, `directories`, `makeDirectory`, `deleteDirectory` | Directories |

`fake()` swaps in a memory disk for tests.

---

## Disks

`app/config/filesystems.ts` defines:

| Disk | Root |
|------|------|
| `local` | `storage/app/private` |
| `public` | `storage/app/public`, URL under `/storage` |

```bash
bun jcc storage:link
```

That creates the symlink in `filesystems.links`, from `public/storage` to the public disk, so `url()` paths resolve in the browser.

`File` is the same filesystem API without a disk name. Paths are absolute or relative to the process. Prefer it for one-off scripts, not for user uploads.
