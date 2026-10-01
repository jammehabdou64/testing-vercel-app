import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { PostingPolicy } from "../../Policies/PostingPolicy";

export class StorePostingRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    return new PostingPolicy().reassign(await currentActor(this));
  }

  override rules() {
    return {
      mission_id: "required|integer",
      starts_on: "required|date",
    };
  }
}
