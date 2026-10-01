import { FormRequest } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { RoleSlug } from "../../Auth/RoleSlug";
import { LeaveApplicationPolicy } from "../../Policies/LeaveApplicationPolicy";

export class StoreLeaveRequest extends FormRequest {
  override async authorize(): Promise<boolean> {
    const actor = await currentActor(this);
    const raw = await this.input("personnel_id");
    if (raw == null || raw === "" || !Number.isFinite(Number(raw))) {
      return actor.role === RoleSlug.ForeignServiceOfficer && actor.personnelId !== null;
    }

    return new LeaveApplicationPolicy().create(actor, Number(raw));
  }

  override rules() {
    return {
      personnel_id: "required|integer",
      leave_type: "required|in:casual,annual",
      starts_on: "required|date",
      ends_on: "required|date",
    };
  }
}
