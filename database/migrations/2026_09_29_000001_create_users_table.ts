import { Migration, Schema } from "bun-jcc";

export default class CreateUsersTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("users", (table) => {
      table.id();
      table.string("name");
      table.string("email").unique();
      table.string("password");
      table.timestamp("email_verified_at").nullable();
      table.nullableTimestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("users");
  }
}
