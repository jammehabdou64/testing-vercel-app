import { Policy } from "bun-jcc/Auth/Policy";
import type { Actor } from "../Auth/Actor";
import { ForeignDiplomaticStaffPolicy } from "./ForeignDiplomaticStaffPolicy";

export class ForeignDiplomaticDependentPolicy extends Policy {
  view(actor: Actor): boolean {
    return ForeignDiplomaticStaffPolicy.manage(actor);
  }

  create(actor: Actor): boolean {
    return ForeignDiplomaticStaffPolicy.manage(actor);
  }

  update(actor: Actor): boolean {
    return this.create(actor);
  }

  delete(actor: Actor): boolean {
    return this.create(actor);
  }
}
