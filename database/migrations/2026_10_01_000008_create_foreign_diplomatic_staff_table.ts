import { Migration, Schema } from "bun-jcc";

/** photograph_path is a private-disk path, not the image bytes. */
export default class CreateForeignDiplomaticStaffTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("foreign_diplomatic_staff", (table) => {
      table.id();
      table
        .foreignId("foreign_diplomatic_mission_id")
        .constrained("foreign_diplomatic_missions")
        .restrictOnDelete();
      table.string("full_name");
      table.string("nationality");
      table.string("passport_number").index();
      table.string("photograph_path").nullable();
      table.string("designation");
      table.string("country_represented");
      table.date("accreditation_starts_on");
      table.date("accreditation_ends_on").nullable();
      table.string("email").nullable();
      table.string("phone").nullable();
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("foreign_diplomatic_staff");
  }
}
