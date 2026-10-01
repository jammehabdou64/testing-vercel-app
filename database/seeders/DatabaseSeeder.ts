import { Seeder } from "bun-jcc";
import { HomeMissionSeeder } from "./HomeMissionSeeder";
import { RoleSeeder } from "./RoleSeeder";

export class DatabaseSeeder extends Seeder {
  async run(): Promise<void> {
    await this.call(RoleSeeder, HomeMissionSeeder);
  }
}
