import { Policy } from "bun-jcc/Auth/Policy";
import { columnId, type Actor } from "../Auth/Actor";
import { PersonnelPolicy } from "./PersonnelPolicy";

export class PersonnelDependentPolicy extends Policy {
  view(actor: Actor, dependent: object): boolean {
    const personnelId = columnId(dependent, "personnel_id");
    return personnelId !== null && PersonnelPolicy.viewRecord(actor, personnelId);
  }

  create(actor: Actor): boolean {
    return PersonnelPolicy.manage(actor);
  }

  update(actor: Actor, dependent: object): boolean {
    return PersonnelPolicy.manage(actor) && this.view(actor, dependent);
  }

  delete(actor: Actor, dependent: object): boolean {
    return this.update(actor, dependent);
  }
}
