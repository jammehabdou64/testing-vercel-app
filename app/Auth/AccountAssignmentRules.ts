import { RoleSlug, roleSlugs, type RoleSlug as RoleSlugName } from "./RoleSlug";
import type { Actor } from "./Actor";

const personnelOptional = new Set<RoleSlugName>([
  RoleSlug.Administrator,
  RoleSlug.HonorableMinister,
  RoleSlug.PermanentSecretary,
]);

/**
 * Role-to-link rules. Foreign keys do not encode these combinations.
 * Foreign diplomatic staff have no role and no user account.
 */
export class AccountAssignmentRules {
  static allows(actor: Actor): boolean {
    return this.message(actor) === null;
  }

  static message(actor: Actor): string | null {
    if (!roleSlugs.includes(actor.role)) {
      return "Unknown role.";
    }

    if (actor.role === RoleSlug.ForeignServiceOfficer) {
      if (actor.personnelId === null) {
        return "A Foreign Service Officer must be linked to one personnel record.";
      }

      if (actor.missionId !== null) {
        return "A Foreign Service Officer is not given a mission login.";
      }

      return null;
    }

    if (actor.role === RoleSlug.MissionPostUser) {
      if (actor.missionId === null) {
        return "A Mission / Post User must be linked to one mission.";
      }

      if (actor.personnelId !== null) {
        return "A Mission / Post User is not linked to a personnel record.";
      }

      return null;
    }

    if (personnelOptional.has(actor.role)) {
      if (actor.missionId !== null) {
        return "Only a Mission / Post User is linked to a mission.";
      }

      return null;
    }

    return "Unknown role.";
  }
}
