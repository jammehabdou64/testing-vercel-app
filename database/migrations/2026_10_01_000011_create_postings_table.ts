import { Migration, Schema } from "bun-jcc";

/**
 * An open posting is the current posting: ends_on is null.
 * Duration is calculated when it is displayed, not stored.
 */
export default class CreatePostingsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("postings", (table) => {
      table.id();
      table.foreignId("personnel_id").constrained("personnel").restrictOnDelete();
      table.foreignId("mission_id").constrained("missions").restrictOnDelete();
      table.date("starts_on");
      table.date("ends_on").nullable();
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("postings");
  }
}
