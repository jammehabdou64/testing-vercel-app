import { Migration, Schema } from "bun-jcc";

/**
 * Due-back is the calendar day after ends_on and is not stored.
 * A second pending application is refused in leave logic, not by a unique index.
 */
export default class CreateLeaveApplicationsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("leave_applications", (table) => {
      table.id();
      table.foreignId("personnel_id").constrained("personnel").restrictOnDelete();
      table.rawColumn(
        "leave_type",
        "varchar(255) not null check (leave_type in ('casual', 'annual'))",
      );
      table.date("starts_on");
      table.date("ends_on");
      table.rawColumn(
        "status",
        "varchar(255) not null default 'pending' check (status in ('pending', 'approved', 'rejected'))",
      );
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("leave_applications");
  }
}
