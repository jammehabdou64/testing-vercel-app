import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Mission } from "../../Models/Mission";
import { MissionPolicy } from "../../Policies/MissionPolicy";
import { StoreMissionRequest } from "../Requests/StoreMissionRequest";
import { UpdateMissionRequest } from "../Requests/UpdateMissionRequest";

/**
 * Gambian mission management.
 *
 * Postings, correspondence, and Mission / Post User accounts reference these rows.
 * This controller does not delete or reassign them. The database restricts a delete
 * while any of those rows still point here.
 */
@Inject()
export class MissionController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    if (!new MissionPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const missions = await Mission.query().orderBy("id").get();
    return Inertia.render("Missions/Index", {
      missions: missions.map((mission) => missionProps(mission)),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (!new MissionPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Missions/Create");
  }

  @Action()
  async store(form: StoreMissionRequest) {
    const data = await form.validated();
    const now = timestamp();
    const mission = await Mission.create({
      name: String(data.name),
      is_home: homeFlag(data.is_home, false),
      created_at: now,
      updated_at: now,
    });

    return response().redirect(`/missions/${mission.id}/edit`).toResponse();
  }

  @Action()
  async edit(mission: Mission) {
    const actor = await currentActor(request());
    if (!new MissionPolicy().update(actor, mission)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Missions/Edit", { mission: missionProps(mission) });
  }

  @Action()
  async update(mission: Mission, form: UpdateMissionRequest) {
    const actor = await currentActor(form);
    if (!new MissionPolicy().update(actor, mission)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    mission.setAttribute("name", String(data.name));
    mission.setAttribute(
      "is_home",
      homeFlag(data.is_home, Boolean(mission.getAttribute("is_home"))),
    );
    mission.setAttribute("updated_at", timestamp());
    await mission.save();

    return response().redirect(`/missions/${mission.id}/edit`).toResponse();
  }
}

function missionProps(mission: Mission) {
  return {
    id: Number(mission.getAttribute("id")),
    name: mission.getAttribute("name"),
    is_home: homeFlag(mission.getAttribute("is_home"), false),
  };
}

function homeFlag(value: unknown, fallback: boolean): boolean {
  if (value == null || value === "") {
    return fallback;
  }

  return value === true || value === 1 || value === "1";
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
