import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticMissionPolicy } from "../../Policies/ForeignDiplomaticMissionPolicy";

export class StoreForeignDiplomaticMissionRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    return new ForeignDiplomaticMissionPolicy().create(await currentActor(this));
  }

  override rules() {
    return {
      name: "required|string|max:255",
      country: "required|string|max:255",
      address: "required|string",
      email: "required|email|max:255",
      phone: "required|string|max:255",
    };
  }
}
