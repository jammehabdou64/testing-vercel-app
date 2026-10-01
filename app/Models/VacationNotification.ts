import { Model } from "bun-jcc";

export class VacationNotification extends Model {
  static table = "vacation_notifications";

  declare id: number;
  declare personnel_id: number;
}
