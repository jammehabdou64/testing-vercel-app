import { Migration, Schema } from "bun-jcc";

export default class CreatePersonnelDependentsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("personnel_dependents", (table) => {
      table.id();
      table.foreignId("personnel_id").constrained("personnel").cascadeOnDelete();
      table.string("full_name");
      table.string("relationship");
      table.date("date_of_birth").nullable();
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("personnel_dependents");
  }
}
