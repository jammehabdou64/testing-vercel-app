import { FormRequest } from "bun-jcc";
import { Storage } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { User } from "../../Models/User";
import { CorrespondenceService } from "../../Services/CorrespondenceService";

export class StoreCorrespondenceRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    const actor = await currentActor(this);
    return new CorrespondenceService(User.getConnection(), Storage.disk("local")).canCompose(
      actor,
    );
  }

  override rules() {
    return {
      to_mission_id: "required|integer",
      body: "required|string",
      composed_on: "required|date",
    };
  }
}
