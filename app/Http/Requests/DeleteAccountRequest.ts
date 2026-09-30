import { FormRequest } from "bun-jcc";

export class DeleteAccountRequest extends FormRequest {
  override authorize(): boolean {
    return true;
  }

  override rules() {
    return {
      password: "required",
    };
  }
}
