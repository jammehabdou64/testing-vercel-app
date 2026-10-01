import { Migration, Schema } from "bun-jcc";

/**
 * A vacation notification is not leave. Who may file or view one is account logic.
 */
export default class CreateVacationNotificationsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("vacation_notifications", (table) => {
      table.id();
      table.foreignId("personnel_id").constrained("personnel").restrictOnDelete();
      table.string("travelling_country");
      table.text("reason");
      table.date("submitted_on");
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("vacation_notifications");
  }
}
