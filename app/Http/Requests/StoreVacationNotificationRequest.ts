import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { VacationNotificationPolicy } from "../../Policies/VacationNotificationPolicy";

export class StoreVacationNotificationRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    const actor = await currentActor(this);
    return (
      actor.personnelId !== null &&
      new VacationNotificationPolicy().create(actor, actor.personnelId)
    );
  }

  override rules() {
    return {
      travelling_country: "required|string|max:255",
      reason: "required|string",
      submitted_on: "required|date",
    };
  }
}
