import { Migration, Schema } from "bun-jcc";

export default class CreateForeignDiplomaticMissionsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("foreign_diplomatic_missions", (table) => {
      table.id();
      table.string("name");
      table.string("country");
      table.text("address");
      table.string("email");
      table.string("phone");
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("foreign_diplomatic_missions");
  }
}
