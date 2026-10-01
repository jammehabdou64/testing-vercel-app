import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticMission } from "../../Models/ForeignDiplomaticMission";
import { ForeignDiplomaticMissionPolicy } from "../../Policies/ForeignDiplomaticMissionPolicy";
import { StoreForeignDiplomaticMissionRequest } from "../Requests/StoreForeignDiplomaticMissionRequest";
import { UpdateForeignDiplomaticMissionRequest } from "../Requests/UpdateForeignDiplomaticMissionRequest";

@Inject()
export class ForeignDiplomaticMissionController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticMissionPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const missions = await ForeignDiplomaticMission.query().orderBy("id").get();
    return Inertia.render("ForeignMissions/Index", {
      missions: missions.map((mission) => missionProps(mission)),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticMissionPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("ForeignMissions/Create");
  }

  @Action()
  async store(form: StoreForeignDiplomaticMissionRequest) {
    const data = await form.validated();
    const now = timestamp();
    const mission = await ForeignDiplomaticMission.create({
      ...missionAttributes(data),
      created_at: now,
      updated_at: now,
    });

    return response().redirect(`/foreign-missions/${mission.id}/edit`).toResponse();
  }

  @Action()
  async edit(mission: ForeignDiplomaticMission) {
    const actor = await currentActor(request());
    if (!new ForeignDiplomaticMissionPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("ForeignMissions/Edit", { mission: missionProps(mission) });
  }

  @Action()
  async update(mission: ForeignDiplomaticMission, form: UpdateForeignDiplomaticMissionRequest) {
    const actor = await currentActor(form);
    if (!new ForeignDiplomaticMissionPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    for (const [key, value] of Object.entries(missionAttributes(data))) {
      mission.setAttribute(key, value);
    }
    mission.setAttribute("updated_at", timestamp());
    await mission.save();

    return response().redirect(`/foreign-missions/${mission.id}/edit`).toResponse();
  }
}

function missionAttributes(data: Record<string, unknown>) {
  return {
    name: String(data.name),
    country: String(data.country),
    address: String(data.address),
    email: String(data.email),
    phone: String(data.phone),
  };
}

function missionProps(mission: ForeignDiplomaticMission) {
  return {
    id: Number(mission.getAttribute("id")),
    name: mission.getAttribute("name"),
    country: mission.getAttribute("country"),
    address: mission.getAttribute("address"),
    email: mission.getAttribute("email"),
    phone: mission.getAttribute("phone"),
  };
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
