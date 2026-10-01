import { Model } from "bun-jcc";

export class ForeignDiplomaticMission extends Model {
  static table = "foreign_diplomatic_missions";

  declare id: number;
}
