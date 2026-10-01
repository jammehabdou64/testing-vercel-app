import { Model } from "bun-jcc";

export class Mission extends Model {
  static table = "missions";

  declare id: number;
  declare is_home: boolean;
}
