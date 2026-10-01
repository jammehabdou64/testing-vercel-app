import { FormRequest } from "bun-jcc";

export class UpdatePersonnelRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      full_name: "required|string|max:255",
      date_of_birth: "required|date",
      passport_number: "required|string|max:255",
      designation: "required|string|max:255",
      email: "nullable|email|max:255",
      phone: "nullable|string|max:255",
      address: "nullable|string",
    };
  }
}
