import { Model } from "bun-jcc";

export class PersonnelDependent extends Model {
  static table = "personnel_dependents";

  declare id: number;
  declare personnel_id: number;
}
