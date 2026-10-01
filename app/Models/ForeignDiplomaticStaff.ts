import { Model } from "bun-jcc";

export class ForeignDiplomaticStaff extends Model {
  static table = "foreign_diplomatic_staff";

  declare id: number;
  declare foreign_diplomatic_mission_id: number;
}
