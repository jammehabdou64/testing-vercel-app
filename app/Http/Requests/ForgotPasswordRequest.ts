import { FormRequest } from "bun-jcc";

export class ForgotPasswordRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      email: "required|email",
    };
  }
}
