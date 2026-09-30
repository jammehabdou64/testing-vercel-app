import { Migration, Schema } from "bun-jcc";

export default class CreatePasswordResetTokensTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("password_reset_tokens", (table) => {
      table.string("email").primary();
      table.string("token");
      table.timestamp("created_at").nullable();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("password_reset_tokens");
  }
}
