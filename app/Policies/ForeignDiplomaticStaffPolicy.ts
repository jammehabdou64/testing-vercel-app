import { Policy } from "bun-jcc/Auth/Policy";
import type { Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

export class ForeignDiplomaticStaffPolicy extends Policy {
  static manage(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  viewAny(actor: Actor): boolean {
    return ForeignDiplomaticStaffPolicy.manage(actor);
  }

  view(actor: Actor): boolean {
    return this.viewAny(actor);
  }

  create(actor: Actor): boolean {
    return ForeignDiplomaticStaffPolicy.manage(actor);
  }

  update(actor: Actor): boolean {
    return this.create(actor);
  }
}
