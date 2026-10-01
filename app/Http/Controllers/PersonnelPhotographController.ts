import { Action, Controller, HttpException, Inject, Storage } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Personnel } from "../../Models/Personnel";
import { User } from "../../Models/User";
import { PersonnelPolicy } from "../../Policies/PersonnelPolicy";
import { PhotographService } from "../../Services/PhotographService";
import { PhotographUploadError } from "../../Services/PhotographUploadError";

@Inject()
export class PersonnelPhotographController extends Controller {
  @Action()
  async store(personnel: Personnel) {
    const http = request();
    const actor = await currentActor(http);
    if (!new PersonnelPolicy().update(actor, personnel)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const upload = await http.file("photograph");
    if (!upload) {
      throw new HttpException(422, "A photograph is required.");
    }

    try {
      await new PhotographService(User.getConnection(), Storage.disk("local")).replacePersonnel(
        actor,
        Number(personnel.id),
        {
          bytes: new Uint8Array(await upload.arrayBuffer()),
          filename: upload.name,
          contentType: upload.type,
        },
      );
    } catch (error) {
      if (error instanceof PhotographUploadError) {
        throw new HttpException(422, error.message);
      }
      throw error;
    }

    return response()
      .redirect(`/personnel/${personnel.id}`)
      .with("status", "Photograph saved.")
      .toResponse();
  }
}
