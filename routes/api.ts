import { Route } from "bun-jcc";

Route.get("/health", () => ({ ok: true }));
