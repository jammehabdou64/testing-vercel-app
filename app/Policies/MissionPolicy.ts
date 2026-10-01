import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

export class MissionPolicy extends Policy {
  viewAny(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  /**
   * openPostingMissionId is the officer's single open posting.
   * Null means there is not exactly one open posting.
   */
  view(actor: Actor, mission: object, openPostingMissionId: number | null = null): boolean {
    if (actor.role === RoleSlug.Administrator) {
      return true;
    }

    const missionId = columnId(mission, "id");
    if (missionId === null) {
      return false;
    }

    if (actor.role === RoleSlug.MissionPostUser) {
      return actor.missionId === missionId;
    }

    if (actor.role === RoleSlug.ForeignServiceOfficer) {
      return openPostingMissionId === missionId;
    }

    return false;
  }

  create(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  update(actor: Actor, mission: object): boolean {
    return this.create(actor) && this.view(actor, mission);
  }
}
