import { Model } from "bun-jcc";

export class Correspondence extends Model {
  static table = "correspondence";

  declare id: number;
  declare from_mission_id: number;
  declare to_mission_id: number;
}
