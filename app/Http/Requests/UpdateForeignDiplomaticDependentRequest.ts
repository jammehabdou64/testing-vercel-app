import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticDependentPolicy } from "../../Policies/ForeignDiplomaticDependentPolicy";

export class UpdateForeignDiplomaticDependentRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    return new ForeignDiplomaticDependentPolicy().update(await currentActor(this));
  }

  override rules() {
    return {
      full_name: "required|string|max:255",
      relationship: "required|in:spouse,child",
    };
  }
}
