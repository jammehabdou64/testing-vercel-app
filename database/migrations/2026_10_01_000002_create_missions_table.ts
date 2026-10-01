import { Migration, Schema } from "bun-jcc";

export default class CreateMissionsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("missions", (table) => {
      table.id();
      table.string("name");
      table.boolean("is_home").default(false);
      table.timestamps();
      table.index("is_home");
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("missions");
  }
}
