import {
  Request as AppRequest,
  Response as AppResponse,
  SecureHeaders,
  env,
  responseContext,
} from "bun-jcc";
import { BroadcastSocket } from "bun-jcc/Broadcasting/BroadcastSocket";
import { getBroadcaster } from "bun-jcc/Support/Facades/Broadcast";
import { app } from "./bootstrap/app";

const port = Number(env("PORT", 8000));
const host = String(env("APP_HOST", "0.0.0.0"));

await app.boot();

const socket = new BroadcastSocket(getBroadcaster());

const server = Bun.serve({
  // hostname: host,
  // port: Number.isFinite(port) ? port : 8000,
  websocket: {
    open: (ws: any) => socket.open(ws),
    message: (ws: any, message: any) => socket.message(ws, message),
    close: (ws: any) => socket.close(ws),
  },
  async fetch(request, server) {
    const upgraded = await socket.upgrade(request, server);
    if (upgraded === true) return undefined;
    if (upgraded) return SecureHeaders.apply(upgraded);

    const staticResponse = await staticFile(request);
    if (staticResponse) return SecureHeaders.apply(staticResponse);

    const req = app.make(AppRequest, [request]);
    const res = req ? app.make(AppResponse, [req]) : undefined;
    if (!req || !res) {
      return new Response("Server Error", { status: 500 });
    }

    req.setIp(server.requestIP(request)?.address ?? null);
    app.instance("Request", req);
    app.instance("Response", res);
    res.on("finish", () => {
      app.release("Request", req);
      app.release("Response", res);
    });

    let responseHandler = await responseContext.run(res, () => app.handle(req));
    if (!responseHandler?.headers) {
      responseHandler = res.send(responseHandler);
    }

    return SecureHeaders.apply(
      res.withSetCookies(responseHandler, req.pullPendingCookies()),
    );
  },
});

async function staticFile(request: Request): Promise<Response | null> {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  if (pathname.includes("..")) return null;

  const file = Bun.file(app.publicPath(pathname.replace(/^\//, "")));
  if (!(await file.exists()) || !(await file.stat()).isFile()) return null;
  return new Response(file);
}

console.log(`Server running at http://${host}:${port}`);
