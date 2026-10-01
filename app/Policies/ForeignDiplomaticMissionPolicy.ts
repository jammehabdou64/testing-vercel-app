import { Policy } from "bun-jcc/Auth/Policy";
import type { Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

/** Search and PDF export for other roles are not granted yet. */
export class ForeignDiplomaticMissionPolicy extends Policy {
  viewAny(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  view(actor: Actor): boolean {
    return this.viewAny(actor);
  }

  create(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  update(actor: Actor): boolean {
    return this.create(actor);
  }

  export(actor: Actor): boolean {
    return this.viewAny(actor);
  }
}
