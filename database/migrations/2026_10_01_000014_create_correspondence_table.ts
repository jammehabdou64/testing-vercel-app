import { Migration, Schema } from "bun-jcc";

/**
 * One letter is shared by sender and recipient.
 * pdf_path is a private-disk path, not the PDF bytes.
 */
export default class CreateCorrespondenceTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("correspondence", (table) => {
      table.id();
      table
        .foreignId("from_mission_id")
        .constrained("missions")
        .restrictOnDelete();
      table.foreignId("to_mission_id").constrained("missions").restrictOnDelete();
      table.rawColumn(
        "body",
        "text not null check (from_mission_id <> to_mission_id)",
      );
      table.date("composed_on");
      table.string("pdf_path");
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("correspondence");
  }
}
