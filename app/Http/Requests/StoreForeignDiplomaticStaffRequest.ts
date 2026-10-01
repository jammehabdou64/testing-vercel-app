import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { ForeignDiplomaticStaffPolicy } from "../../Policies/ForeignDiplomaticStaffPolicy";

export class StoreForeignDiplomaticStaffRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    return new ForeignDiplomaticStaffPolicy().create(await currentActor(this));
  }

  override rules() {
    return {
      full_name: "required|string|max:255",
      nationality: "required|string|max:255",
      passport_number: "required|string|max:255",
      designation: "required|string|max:255",
      country_represented: "required|string|max:255",
      accreditation_starts_on: "required|date",
      accreditation_ends_on: "nullable|date",
      email: "nullable|email|max:255",
      phone: "nullable|string|max:255",
    };
  }
}
