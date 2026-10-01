import { Model } from "bun-jcc";

export class Posting extends Model {
  static table = "postings";

  declare id: number;
  declare personnel_id: number;
  declare mission_id: number;
}
