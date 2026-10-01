import { Auth, HttpException } from "bun-jcc";
import type { AppRequest } from "bun-jcc/Http/Request/Request";
import { Role } from "../Models/Role";
import type { PhotographActor } from "../Services/PhotographService";
import type { RoleSlug } from "./RoleSlug";

/** The signed-in user as the actor policies and services already accept. */
export async function currentActor(request: AppRequest): Promise<PhotographActor> {
  const user = await Auth.user(request);
  if (!user) {
    throw new HttpException(403, "This action is unauthorized.");
  }

  const roleId = user.getAttribute("role_id");
  const role =
    roleId == null ? null : await Role.where("id", Number(roleId)).first();
  const slug = role?.getAttribute("slug");
  if (typeof slug !== "string") {
    throw new HttpException(403, "This action is unauthorized.");
  }

  return {
    userId: Number(user.getAttribute("id")),
    role: slug as RoleSlug,
    personnelId: nullableId(user.getAttribute("personnel_id")),
    missionId: nullableId(user.getAttribute("mission_id")),
  };
}

function nullableId(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
