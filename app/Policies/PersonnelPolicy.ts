import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";

export class PersonnelPolicy extends Policy {
  static viewRecord(actor: Actor, personnelId: number): boolean {
    if (actor.role === RoleSlug.Administrator) {
      return true;
    }

    return (
      actor.role === RoleSlug.ForeignServiceOfficer &&
      actor.personnelId === personnelId
    );
  }

  static manage(actor: Actor): boolean {
    return actor.role === RoleSlug.Administrator;
  }

  viewAny(actor: Actor): boolean {
    return PersonnelPolicy.manage(actor);
  }

  view(actor: Actor, personnel: object): boolean {
    const personnelId = columnId(personnel, "id");
    return personnelId !== null && PersonnelPolicy.viewRecord(actor, personnelId);
  }

  create(actor: Actor): boolean {
    return PersonnelPolicy.manage(actor);
  }

  update(actor: Actor, personnel: object): boolean {
    return this.view(actor, personnel) && PersonnelPolicy.manage(actor);
  }

  delete(_actor: Actor): boolean {
    return false;
  }
}
