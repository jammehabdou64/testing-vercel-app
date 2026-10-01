import { Action, Controller, HttpException, Inject, Storage } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticMission } from "../../Models/ForeignDiplomaticMission";
import { ForeignDiplomaticStaff } from "../../Models/ForeignDiplomaticStaff";
import { User } from "../../Models/User";
import { ForeignDiplomaticStaffPolicy } from "../../Policies/ForeignDiplomaticStaffPolicy";
import { PhotographService } from "../../Services/PhotographService";
import { PhotographUploadError } from "../../Services/PhotographUploadError";
import { ensureStaff } from "./ForeignDiplomaticStaffController";

@Inject()
export class ForeignDiplomaticStaffPhotographController extends Controller {
  @Action()
  async store(mission: ForeignDiplomaticMission, staff: ForeignDiplomaticStaff) {
    ensureStaff(mission, staff);
    const http = request();
    const actor = await currentActor(http);
    if (!new ForeignDiplomaticStaffPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const upload = await http.file("photograph");
    if (!upload) {
      throw new HttpException(422, "A photograph is required.");
    }

    try {
      await new PhotographService(
        User.getConnection(),
        Storage.disk("local"),
      ).replaceDiplomaticStaff(actor, Number(staff.id), {
        bytes: new Uint8Array(await upload.arrayBuffer()),
        filename: upload.name,
        contentType: upload.type,
      });
    } catch (error) {
      if (error instanceof PhotographUploadError) {
        throw new HttpException(422, error.message);
      }
      throw error;
    }

    return response()
      .redirect(`/foreign-missions/${mission.id}/staff/${staff.id}`)
      .with("status", "Photograph saved.")
      .toResponse();
  }
}
