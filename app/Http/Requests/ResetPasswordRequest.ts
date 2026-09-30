import { FormRequest } from "bun-jcc";

export class ResetPasswordRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      token: "required",
      email: "required|email",
      password: "required|min:8|confirmed",
    };
  }
}
