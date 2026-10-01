import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticDependent } from "../../Models/ForeignDiplomaticDependent";
import { ForeignDiplomaticMission } from "../../Models/ForeignDiplomaticMission";
import { ForeignDiplomaticStaff } from "../../Models/ForeignDiplomaticStaff";
import { ForeignDiplomaticStaffPolicy } from "../../Policies/ForeignDiplomaticStaffPolicy";
import { StoreForeignDiplomaticStaffRequest } from "../Requests/StoreForeignDiplomaticStaffRequest";
import { UpdateForeignDiplomaticStaffRequest } from "../Requests/UpdateForeignDiplomaticStaffRequest";

@Inject()
export class ForeignDiplomaticStaffController extends Controller {
  @Action()
  async index(mission: ForeignDiplomaticMission) {
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticStaffPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const staff = await ForeignDiplomaticStaff.query()
      .where("foreign_diplomatic_mission_id", Number(mission.id))
      .orderBy("id")
      .get();
    return Inertia.render("ForeignStaff/Index", {
      mission: missionSummary(mission),
      staff: staff.map((member) => staffProps(member)),
    });
  }

  @Action()
  async create(mission: ForeignDiplomaticMission) {
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticStaffPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("ForeignStaff/Create", {
      mission: missionSummary(mission),
    });
  }

  @Action()
  async store(mission: ForeignDiplomaticMission, form: StoreForeignDiplomaticStaffRequest) {
    const actor = await currentActor(form);
    if (!new ForeignDiplomaticStaffPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const now = timestamp();
    const member = await ForeignDiplomaticStaff.create({
      foreign_diplomatic_mission_id: Number(mission.id),
      ...staffAttributes(data),
      photograph_path: null,
      created_at: now,
      updated_at: now,
    });

    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${member.id}`)
      .toResponse();
  }

  @Action()
  async show(mission: ForeignDiplomaticMission, staff: ForeignDiplomaticStaff) {
    ensureStaff(mission, staff);
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticStaffPolicy().view(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const dependents = await ForeignDiplomaticDependent.query()
      .where("foreign_diplomatic_staff_id", Number(staff.id))
      .orderBy("id")
      .get();
    return Inertia.render("ForeignStaff/Show", {
      mission: missionSummary(mission),
      staff: staffProps(staff),
      dependents: dependents.map((dependent) => ({
        id: Number(dependent.getAttribute("id")),
        full_name: dependent.getAttribute("full_name"),
        relationship: dependent.getAttribute("relationship"),
      })),
    });
  }

  @Action()
  async edit(mission: ForeignDiplomaticMission, staff: ForeignDiplomaticStaff) {
    ensureStaff(mission, staff);
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticStaffPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("ForeignStaff/Edit", {
      mission: missionSummary(mission),
      staff: staffProps(staff),
    });
  }

  @Action()
  async update(
    mission: ForeignDiplomaticMission,
    staff: ForeignDiplomaticStaff,
    form: UpdateForeignDiplomaticStaffRequest,
  ) {
    ensureStaff(mission, staff);
    const actor = await currentActor(form);
    if (!new ForeignDiplomaticStaffPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    for (const [key, value] of Object.entries(staffAttributes(data))) {
      staff.setAttribute(key, value);
    }
    staff.setAttribute("updated_at", timestamp());
    await staff.save();

    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${staff.id}`)
      .toResponse();
  }
}

export function ensureStaff(
  mission: ForeignDiplomaticMission,
  staff: ForeignDiplomaticStaff,
): void {
  if (Number(staff.getAttribute("foreign_diplomatic_mission_id")) !== Number(mission.id)) {
    throw new HttpException(404, "Not found.");
  }
}

function staffAttributes(data: Record<string, unknown>) {
  return {
    full_name: String(data.full_name),
    nationality: String(data.nationality),
    passport_number: String(data.passport_number),
    designation: String(data.designation),
    country_represented: String(data.country_represented),
    accreditation_starts_on: String(data.accreditation_starts_on),
    accreditation_ends_on: nullableText(data.accreditation_ends_on),
    email: nullableText(data.email),
    phone: nullableText(data.phone),
  };
}

function missionSummary(mission: ForeignDiplomaticMission) {
  return {
    id: Number(mission.id),
    name: String(mission.getAttribute("name") ?? ""),
    country: String(mission.getAttribute("country") ?? ""),
    address: String(mission.getAttribute("address") ?? ""),
    email: String(mission.getAttribute("email") ?? ""),
    phone: String(mission.getAttribute("phone") ?? ""),
  };
}

function staffProps(staff: ForeignDiplomaticStaff) {
  return {
    id: Number(staff.getAttribute("id")),
    foreign_diplomatic_mission_id: Number(staff.getAttribute("foreign_diplomatic_mission_id")),
    full_name: staff.getAttribute("full_name"),
    nationality: staff.getAttribute("nationality"),
    passport_number: staff.getAttribute("passport_number"),
    photograph_on_file:
      staff.getAttribute("photograph_path") != null && staff.getAttribute("photograph_path") !== "",
    designation: staff.getAttribute("designation"),
    country_represented: staff.getAttribute("country_represented"),
    accreditation_starts_on: String(staff.getAttribute("accreditation_starts_on")).slice(0, 10),
    accreditation_ends_on: staff.getAttribute("accreditation_ends_on")
      ? String(staff.getAttribute("accreditation_ends_on")).slice(0, 10)
      : null,
    email: staff.getAttribute("email"),
    phone: staff.getAttribute("phone"),
  };
}

function nullableText(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  return String(value);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
