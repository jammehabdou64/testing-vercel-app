import { Migration, Schema } from "bun-jcc";

export default class CreateRolesTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("roles", (table) => {
      table.id();
      table.string("name");
      table.string("slug").unique();
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("roles");
  }
}
