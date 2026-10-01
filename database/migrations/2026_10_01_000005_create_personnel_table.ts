import { Migration, Schema } from "bun-jcc";

/** photograph_path is a private-disk path, not the image bytes. */
export default class CreatePersonnelTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("personnel", (table) => {
      table.id();
      table.string("full_name");
      table.date("date_of_birth");
      table.string("passport_number").index();
      table.string("email").nullable();
      table.string("phone").nullable();
      table.text("address").nullable();
      table.string("designation");
      table.string("photograph_path").nullable();
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("personnel");
  }
}
