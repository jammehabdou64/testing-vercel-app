import { Model } from "bun-jcc";

export class LeaveApplication extends Model {
  static table = "leave_applications";

  declare id: number;
  declare personnel_id: number;
  declare status: string;
}
