import { Model } from "bun-jcc";

export class Role extends Model {
  static table = "roles";

  declare id: number;
  declare name: string;
  declare slug: string;
}
