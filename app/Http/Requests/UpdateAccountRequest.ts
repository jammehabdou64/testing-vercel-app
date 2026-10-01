import { FormRequest } from "bun-jcc";
import { roleSlugs } from "../../Auth/RoleSlug";

export class UpdateAccountRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      name: "required|string|max:255",
      email: "required|email|max:255",
      role: `required|in:${roleSlugs.join(",")}`,
      personnel_id: "nullable|integer",
      mission_id: "nullable|integer",
    };
  }
}
