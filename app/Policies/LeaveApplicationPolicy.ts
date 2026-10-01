import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

/**
 * LV-04 names the Permanent Secretary as the decision maker.
 * The Minister may view an application and may not decide it.
 */
export class LeaveApplicationPolicy extends Policy {
  viewAny(actor: Actor): boolean {
    return (
      actor.role === RoleSlug.PermanentSecretary ||
      actor.role === RoleSlug.HonorableMinister
    );
  }

  view(actor: Actor, leave: object): boolean {
    if (this.viewAny(actor)) {
      return true;
    }

    const personnelId = columnId(leave, "personnel_id");
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

  decide(actor: Actor): boolean {
    return actor.role === RoleSlug.PermanentSecretary;
  }
}
