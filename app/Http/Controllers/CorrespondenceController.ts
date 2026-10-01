import { Action, Controller, HttpException, Inject, Inertia, Storage } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Correspondence } from "../../Models/Correspondence";
import { Mission } from "../../Models/Mission";
import { User } from "../../Models/User";
import { CorrespondenceService } from "../../Services/CorrespondenceService";
import type { CorrespondenceRow } from "../../Services/CorrespondenceService";
import { CorrespondenceWorkflowError } from "../../Services/CorrespondenceWorkflowError";
import { StoreCorrespondenceRequest } from "../Requests/StoreCorrespondenceRequest";

@Inject()
export class CorrespondenceController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    const service = this.service();
    if ((await service.viewerMission(actor)) === null) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const letters = await service.visibleTo(actor);
    const missionNames = await missionNameMap(
      letters.flatMap((letter) => [Number(letter.from_mission_id), Number(letter.to_mission_id)]),
    );
    return Inertia.render("Correspondence/Index", {
      correspondence: letters.map((letter) => ({
        ...letterProps(letter),
        from_mission_name: missionNames.get(Number(letter.from_mission_id)) ?? "",
        to_mission_name: missionNames.get(Number(letter.to_mission_id)) ?? "",
      })),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (!(await this.service().canCompose(actor))) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const fromMissionId = await this.service().viewerMission(actor);
    const missions = await Mission.query().orderBy("name").get();
    return Inertia.render("Correspondence/Create", {
      missions: missions
        .filter((mission) => Number(mission.id) !== fromMissionId)
        .map((mission) => ({
          id: Number(mission.id),
          name: String(mission.getAttribute("name") ?? ""),
        })),
    });
  }

  @Action()
  async store(form: StoreCorrespondenceRequest) {
    const actor = await currentActor(form);
    const data = await form.validated();

    try {
      await this.service().compose(actor, {
        toMissionId: Number(data.to_mission_id),
        body: String(data.body),
        composedOn: String(data.composed_on),
      });
    } catch (error) {
      if (error instanceof CorrespondenceWorkflowError) {
        throw new HttpException(422, error.message);
      }
      throw error;
    }

    return response().redirect("/correspondence").toResponse();
  }

  @Action()
  async pdf(correspondence: Correspondence) {
    const actor = await currentActor(request());
    const visible = await this.service().visibleTo(actor);
    const letter = visible.find((row) => Number(row.id) === Number(correspondence.id));
    if (!letter) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Storage.disk("local").download(letter.pdf_path, "correspondence.pdf");
  }

  private service(): CorrespondenceService {
    return new CorrespondenceService(User.getConnection(), Storage.disk("local"));
  }
}

async function missionNameMap(missionIds: number[]): Promise<Map<number, string>> {
  const ids = [...new Set(missionIds)];
  if (ids.length === 0) {
    return new Map();
  }

  const missions = await Mission.query().whereIn("id", ids).get();
  return new Map(
    missions.map((mission) => [Number(mission.id), String(mission.getAttribute("name") ?? "")]),
  );
}

function letterProps(letter: CorrespondenceRow) {
  return {
    id: Number(letter.id),
    from_mission_id: Number(letter.from_mission_id),
    to_mission_id: Number(letter.to_mission_id),
    body: letter.body,
    composed_on: String(letter.composed_on).slice(0, 10),
  };
}
