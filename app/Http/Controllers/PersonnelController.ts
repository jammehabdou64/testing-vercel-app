import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Mission } from "../../Models/Mission";
import { Personnel } from "../../Models/Personnel";
import { PersonnelDependent } from "../../Models/PersonnelDependent";
import { Posting } from "../../Models/Posting";
import { PersonnelPolicy } from "../../Policies/PersonnelPolicy";
import { StorePersonnelRequest } from "../Requests/StorePersonnelRequest";
import { UpdatePersonnelRequest } from "../Requests/UpdatePersonnelRequest";

@Inject()
export class PersonnelController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    if (!new PersonnelPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const records = await Personnel.query().orderBy("id").get();
    return Inertia.render("Personnel/Index", {
      personnel: records.map((record) => personnelProps(record)),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (!new PersonnelPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Personnel/Create");
  }

  @Action()
  async store(form: StorePersonnelRequest) {
    const actor = await currentActor(form);
    if (!new PersonnelPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const now = timestamp();
    const personnel = await Personnel.create({
      ...personnelAttributes(data),
      photograph_path: null,
      created_at: now,
      updated_at: now,
    });

    return response().redirect(`/personnel/${personnel.id}`).toResponse();
  }

  @Action()
  async show(personnel: Personnel) {
    const actor = await currentActor(request());
    if (!new PersonnelPolicy().view(actor, personnel)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const personnelId = Number(personnel.id);
    const dependents = await PersonnelDependent.query()
      .where("personnel_id", personnelId)
      .orderBy("id")
      .get();
    const postings = await Posting.query()
      .where("personnel_id", personnelId)
      .orderBy("id")
      .get();
    const missionIds = [
      ...new Set(postings.map((posting) => Number(posting.getAttribute("mission_id")))),
    ];
    const missions =
      missionIds.length === 0
        ? []
        : await Mission.query().whereIn("id", missionIds).get();
    const missionNames = new Map(
      missions.map((mission) => [Number(mission.id), String(mission.getAttribute("name") ?? "")]),
    );

    return Inertia.render("Personnel/Show", {
      personnel: personnelProps(personnel),
      dependents: dependents.map((dependent) => ({
        id: Number(dependent.getAttribute("id")),
        full_name: dependent.getAttribute("full_name"),
        relationship: dependent.getAttribute("relationship"),
        date_of_birth: dateOnly(dependent.getAttribute("date_of_birth")),
      })),
      postings: postings.map((posting) => ({
        id: Number(posting.getAttribute("id")),
        mission_id: Number(posting.getAttribute("mission_id")),
        mission_name: missionNames.get(Number(posting.getAttribute("mission_id"))) ?? "",
        starts_on: dateOnly(posting.getAttribute("starts_on")) ?? "",
        ends_on: dateOnly(posting.getAttribute("ends_on")),
      })),
    });
  }

  @Action()
  async edit(personnel: Personnel) {
    const actor = await currentActor(request());
    if (!new PersonnelPolicy().update(actor, personnel)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Personnel/Edit", {
      personnel: personnelProps(personnel),
    });
  }

  @Action()
  async update(personnel: Personnel, form: UpdatePersonnelRequest) {
    const actor = await currentActor(form);
    if (!new PersonnelPolicy().update(actor, personnel)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    for (const [key, value] of Object.entries(personnelAttributes(data))) {
      personnel.setAttribute(key, value);
    }
    personnel.setAttribute("updated_at", timestamp());
    await personnel.save();

    return response().redirect(`/personnel/${personnel.id}`).toResponse();
  }
}

function personnelAttributes(data: Record<string, unknown>) {
  return {
    full_name: String(data.full_name),
    date_of_birth: String(data.date_of_birth),
    passport_number: String(data.passport_number),
    designation: String(data.designation),
    email: nullableText(data.email),
    phone: nullableText(data.phone),
    address: nullableText(data.address),
  };
}

function personnelProps(personnel: Personnel) {
  return {
    id: Number(personnel.getAttribute("id")),
    full_name: personnel.getAttribute("full_name"),
    date_of_birth: personnel.getAttribute("date_of_birth"),
    passport_number: personnel.getAttribute("passport_number"),
    designation: personnel.getAttribute("designation"),
    email: personnel.getAttribute("email"),
    phone: personnel.getAttribute("phone"),
    address: personnel.getAttribute("address"),
    photograph_on_file: personnel.getAttribute("photograph_path") != null && personnel.getAttribute("photograph_path") !== "",
  };
}

function nullableText(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  return String(value);
}

function dateOnly(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  return String(value).slice(0, 10);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
