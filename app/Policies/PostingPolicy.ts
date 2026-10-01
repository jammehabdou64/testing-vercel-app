import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";
import { PersonnelPolicy } from "./PersonnelPolicy";

/** Who may reassign is this policy. Closing the previous posting is PostingService work. */
export class PostingPolicy extends Policy {
  view(actor: Actor, posting: object): boolean {
    const personnelId = columnId(posting, "personnel_id");
    if (personnelId === null) {
      return false;
    }

    return PersonnelPolicy.viewRecord(actor, personnelId);
  }

  reassign(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }
}
