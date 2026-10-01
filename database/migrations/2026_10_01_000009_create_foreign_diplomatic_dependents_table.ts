import { Migration, Schema } from "bun-jcc";

export default class CreateForeignDiplomaticDependentsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("foreign_diplomatic_dependents", (table) => {
      table.id();
      table
        .foreignId("foreign_diplomatic_staff_id")
        .constrained("foreign_diplomatic_staff")
        .cascadeOnDelete();
      table.string("full_name");
      table.rawColumn(
        "relationship",
        "varchar(255) not null check (relationship in ('spouse', 'child'))",
      );
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("foreign_diplomatic_dependents");
  }
}
