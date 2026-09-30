import { env } from "bun-jcc/helpers";
import { app } from "./bootstrap/app";

const port = Number(env("PORT", 8000));
const host = String(env("APP_HOST", "127.0.0.1"));

await app.listen(port, host);
