import { Model } from "bun-jcc";

export class Personnel extends Model {
  static table = "personnel";

  declare id: number;
}
