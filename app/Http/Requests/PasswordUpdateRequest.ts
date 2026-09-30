import { FormRequest } from "bun-jcc";

export class PasswordUpdateRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      current_password: "required",
      password: "required|min:8|confirmed",
    };
  }
}
