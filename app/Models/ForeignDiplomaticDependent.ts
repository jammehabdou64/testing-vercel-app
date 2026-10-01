import { Model } from "bun-jcc";

export class ForeignDiplomaticDependent extends Model {
  static table = "foreign_diplomatic_dependents";

  declare id: number;
  declare foreign_diplomatic_staff_id: number;
}
