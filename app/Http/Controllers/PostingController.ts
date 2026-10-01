import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Mission } from "../../Models/Mission";
import { Personnel } from "../../Models/Personnel";
import { Posting } from "../../Models/Posting";
import { User } from "../../Models/User";
import { PersonnelPolicy } from "../../Policies/PersonnelPolicy";
import { PostingAssignmentError } from "../../Services/PostingAssignmentError";
import { PostingService } from "../../Services/PostingService";
import { StorePostingRequest } from "../Requests/StorePostingRequest";

@Inject()
export class PostingController extends Controller {
  @Action()
  async index(personnel: Personnel) {
    const actor = await currentActor(request());
    if (!new PersonnelPolicy().view(actor, personnel)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const rows = await Posting.query()
      .where("personnel_id", Number(personnel.id))
      .orderBy("id")
      .get();

    const missionIds = [
      ...new Set(rows.map((posting) => Number(posting.getAttribute("mission_id")))),
    ];
    const missions =
      missionIds.length === 0
        ? []
        : await Mission.query().whereIn("id", missionIds).get();
    const missionNames = new Map(
      missions.map((mission) => [Number(mission.id), String(mission.getAttribute("name") ?? "")]),
    );

    const missionOptions = await Mission.query().orderBy("name").get();

    return Inertia.render("Postings/Index", {
      personnel: {
        id: Number(personnel.id),
        full_name: personnel.getAttribute("full_name"),
      },
      missions: missionOptions.map((mission) => ({
        id: Number(mission.id),
        name: String(mission.getAttribute("name") ?? ""),
      })),
      postings: rows.map((posting) => ({
        id: Number(posting.getAttribute("id")),
        mission_id: Number(posting.getAttribute("mission_id")),
        mission_name: missionNames.get(Number(posting.getAttribute("mission_id"))) ?? "",
        starts_on: String(posting.getAttribute("starts_on")).slice(0, 10),
        ends_on: posting.getAttribute("ends_on")
          ? String(posting.getAttribute("ends_on")).slice(0, 10)
          : null,
      })),
    });
  }

  @Action()
  async store(personnel: Personnel, form: StorePostingRequest) {
    const actor = await currentActor(form);
    const data = await form.validated();

    try {
      await new PostingService(User.getConnection()).assign(actor, {
        personnelId: Number(personnel.id),
        missionId: Number(data.mission_id),
        startsOn: String(data.starts_on),
      });
    } catch (error) {
      if (error instanceof PostingAssignmentError) {
        throw new HttpException(422, error.message);
      }
      throw error;
    }

    return response().redirect(`/personnel/${personnel.id}/postings`).toResponse();
  }
}
