import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { MissionPolicy } from "../../Policies/MissionPolicy";

export class UpdateMissionRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    return new MissionPolicy().create(await currentActor(this));
  }

  override rules() {
    return {
      name: "required|string|max:255",
      is_home: "nullable|in:0,1",
    };
  }
}
