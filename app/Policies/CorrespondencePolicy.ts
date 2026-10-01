import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

/**
 * Authorization only. The database rejects a letter whose missions are the same.
 * openPostingMissionId is null unless the officer has exactly one open posting.
 */
export class CorrespondencePolicy extends Policy {
  compose(
    actor: Actor,
    fromMissionId: number,
    openPostingMissionId: number | null,
  ): boolean {
    if (actor.role === RoleSlug.MissionPostUser) {
      return actor.missionId !== null && actor.missionId === fromMissionId;
    }

    if (actor.role === RoleSlug.ForeignServiceOfficer) {
      return (
        actor.personnelId !== null &&
        openPostingMissionId !== null &&
        openPostingMissionId === fromMissionId
      );
    }

    return false;
  }

  view(
    actor: Actor,
    letter: object,
    openPostingMissionId: number | null = null,
  ): boolean {
    const fromMissionId = columnId(letter, "from_mission_id");
    const toMissionId = columnId(letter, "to_mission_id");
    if (fromMissionId === null || toMissionId === null) {
      return false;
    }

    const missionId = this.viewerMissionId(actor, openPostingMissionId);
    if (missionId === null) {
      return false;
    }

    return missionId === fromMissionId || missionId === toMissionId;
  }

  private viewerMissionId(
    actor: Actor,
    openPostingMissionId: number | null,
  ): number | null {
    if (actor.role === RoleSlug.MissionPostUser) {
      return actor.missionId;
    }

    if (actor.role === RoleSlug.ForeignServiceOfficer) {
      return openPostingMissionId;
    }

    return null;
  }
}
