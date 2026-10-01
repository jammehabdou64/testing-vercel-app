import { DB, Seeder } from "bun-jcc";

const roles = [
  { name: "Administrator", slug: "administrator" },
  { name: "Honorable Minister", slug: "honorable_minister" },
  { name: "Permanent Secretary", slug: "permanent_secretary" },
  { name: "Foreign Service Officer", slug: "foreign_service_officer" },
  { name: "Mission / Post User", slug: "mission_post_user" },
] as const;

export class RoleSeeder extends Seeder {
  async run(): Promise<void> {
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    for (const role of roles) {
      const existing = await DB.table("roles").where("slug", role.slug).first();
      if (existing) {
        continue;
      }

      await DB.table("roles").insert({
        name: role.name,
        slug: role.slug,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  }
}
