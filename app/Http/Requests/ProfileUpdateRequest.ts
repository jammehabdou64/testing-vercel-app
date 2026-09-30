import { Auth, FormRequest } from "bun-jcc";

export class ProfileUpdateRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override async rules() {
    const user = await Auth.user(this);
    const id = user?.getAuthIdentifier() ?? "0";
    return {
      name: "required",
      email: `required|email|unique:users,email,${id},id`,
    };
  }
}
