import type { AppRequest } from "bun-jcc/Http/Request/Request";
import { HandleInertiaRequests as Middleware } from "bun-jcc/Inertia/HandleInertiaRequests";
import { config } from "../../../config";
import { Role } from "../../Models/Role";

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
              role: await roleSlug(user.getAttribute("role_id")),
              personnelId: nullableId(user.getAttribute("personnel_id")),
              missionId: nullableId(user.getAttribute("mission_id")),
            }
          : null,
      },
    };
  }
}

async function roleSlug(roleId: unknown): Promise<string | null> {
  if (roleId == null || roleId === "") {
    return null;
  }

  const role = await Role.where("id", Number(roleId)).first();
  const slug = role?.getAttribute("slug");
  return typeof slug === "string" ? slug : null;
}

function nullableId(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
