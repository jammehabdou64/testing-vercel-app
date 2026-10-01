import { Policy } from "bun-jcc/Auth/Policy";
import { AccountAssignmentRules } from "../Auth/AccountAssignmentRules";
import type { Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

export class UserPolicy extends Policy {
  viewAny(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  create(actor: Actor, assignment: Actor): boolean {
    return this.viewAny(actor) && AccountAssignmentRules.allows(assignment);
  }

  update(actor: Actor, assignment: Actor): boolean {
    return this.create(actor, assignment);
  }
}
