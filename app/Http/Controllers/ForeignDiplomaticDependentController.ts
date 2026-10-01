import { Action, Controller, HttpException, Inject } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticDependent } from "../../Models/ForeignDiplomaticDependent";
import { ForeignDiplomaticMission } from "../../Models/ForeignDiplomaticMission";
import { ForeignDiplomaticStaff } from "../../Models/ForeignDiplomaticStaff";
import { ForeignDiplomaticDependentPolicy } from "../../Policies/ForeignDiplomaticDependentPolicy";
import { StoreForeignDiplomaticDependentRequest } from "../Requests/StoreForeignDiplomaticDependentRequest";
import { UpdateForeignDiplomaticDependentRequest } from "../Requests/UpdateForeignDiplomaticDependentRequest";
import { ensureStaff } from "./ForeignDiplomaticStaffController";

@Inject()
export class ForeignDiplomaticDependentController extends Controller {
  @Action()
  async store(
    mission: ForeignDiplomaticMission,
    staff: ForeignDiplomaticStaff,
    form: StoreForeignDiplomaticDependentRequest,
  ) {
    ensureStaff(mission, staff);
    const actor = await currentActor(form);
    if (!new ForeignDiplomaticDependentPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const now = timestamp();
    await ForeignDiplomaticDependent.create({
      foreign_diplomatic_staff_id: Number(staff.id),
      full_name: String(data.full_name),
      relationship: String(data.relationship),
      created_at: now,
      updated_at: now,
    });

    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${staff.id}`)
      .toResponse();
  }

  @Action()
  async update(
    mission: ForeignDiplomaticMission,
    staff: ForeignDiplomaticStaff,
    dependent: ForeignDiplomaticDependent,
    form: UpdateForeignDiplomaticDependentRequest,
  ) {
    ensureStaff(mission, staff);
    ensureDependent(staff, dependent);
    const actor = await currentActor(form);
    if (!new ForeignDiplomaticDependentPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    dependent.setAttribute("full_name", String(data.full_name));
    dependent.setAttribute("relationship", String(data.relationship));
    dependent.setAttribute("updated_at", timestamp());
    await dependent.save();

    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${staff.id}`)
      .toResponse();
  }

  @Action()
  async destroy(
    mission: ForeignDiplomaticMission,
    staff: ForeignDiplomaticStaff,
    dependent: ForeignDiplomaticDependent,
  ) {
    ensureStaff(mission, staff);
    ensureDependent(staff, dependent);
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticDependentPolicy().delete(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    await dependent.delete();
    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${staff.id}`)
      .toResponse();
  }
}

function ensureDependent(
  staff: ForeignDiplomaticStaff,
  dependent: ForeignDiplomaticDependent,
): void {
  if (
    Number(dependent.getAttribute("foreign_diplomatic_staff_id")) !==
    Number(staff.id)
  ) {
    throw new HttpException(404, "Not found.");
  }
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
