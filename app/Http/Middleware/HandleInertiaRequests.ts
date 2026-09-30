import type { AppRequest } from "bun-jcc/Http/Request/Request";
import { HandleInertiaRequests as Middleware } from "bun-jcc/Inertia/HandleInertiaRequests";
import { config } from "../../../config";

export class HandleInertiaRequests extends Middleware {
  protected override ssr: boolean = true;

  override async share(request: AppRequest) {
    const user = await request.user();
    return {
      ...(await super.share(request)),
      name: config.app.name,
      auth: {
        user: user
          ? {
              name: String(user.getAttribute("name") ?? ""),
              email: String(user.getAttribute("email") ?? ""),
            }
          : null,
      },
    };
  }
}
