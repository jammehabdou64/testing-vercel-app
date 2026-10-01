import { Action, Controller, Inject } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { User } from "../../Models/User";
import { ForeignDirectoryExportService } from "../../Services/ForeignDirectoryExportService";

@Inject()
export class ForeignDirectoryExportController extends Controller {
  @Action()
  async show() {
    const http = request();
    const actor = await currentActor(http);
    const country = http.query("country");
    const missionName = http.query("mission_name");
    const bytes = await new ForeignDirectoryExportService(User.getConnection()).exportDirectory(
      actor,
      {
        country: typeof country === "string" ? country : null,
        missionName: typeof missionName === "string" ? missionName : null,
      },
    );

    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="foreign-directory.pdf"',
      },
    });
  }
}
