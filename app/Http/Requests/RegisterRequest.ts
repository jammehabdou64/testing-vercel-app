import { FormRequest } from "bun-jcc";

export class RegisterRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      name: "required",
      email: "required|email|unique:users,email",
      password: "required|min:8|confirmed",
    };
  }
}
