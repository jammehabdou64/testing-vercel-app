import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

/** Other viewers besides the officer and an Administrator are not granted. */
export class VacationNotificationPolicy extends Policy {
  view(actor: Actor, notification: object): boolean {
    if (actor.role === RoleSlug.Administrator) {
      return true;
    }

    const personnelId = columnId(notification, "personnel_id");
    return (
      actor.role === RoleSlug.ForeignServiceOfficer &&
      personnelId !== null &&
      actor.personnelId === personnelId
    );
  }

  create(actor: Actor, personnelId: number): boolean {
    return (
      actor.role === RoleSlug.ForeignServiceOfficer &&
      actor.personnelId !== null &&
      actor.personnelId === personnelId
    );
  }
}
