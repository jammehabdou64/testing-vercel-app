import { FormRequest } from "bun-jcc";

export class UpdatePersonnelDependentRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      full_name: "required|string|max:255",
      relationship: "required|string|max:255",
      date_of_birth: "nullable|date",
    };
  }
}
