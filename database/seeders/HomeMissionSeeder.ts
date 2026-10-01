import { DB, Seeder } from "bun-jcc";

export class HomeMissionSeeder extends Seeder {
  async run(): Promise<void> {
    const existing = await DB.table("missions").where("name", "Home").first();
    if (existing) {
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    await DB.table("missions").insert({
      name: "Home",
      is_home: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
  }
}
