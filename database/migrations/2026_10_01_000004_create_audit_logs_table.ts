import { Migration, Schema } from "bun-jcc";

export default class CreateAuditLogsTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("audit_logs", (table) => {
      table.id();
      table.foreignId("user_id").nullable().constrained("users").nullOnDelete();
      table.string("action");
      table.string("module");
      table.string("subject_type").nullable();
      table.unsignedBigInteger("subject_id").nullable();
      table.json("before").nullable();
      table.json("after").nullable();
      table.ipAddress("ip_address").nullable();
      table.timestamp("created_at").useCurrent();
      table.index(["subject_type", "subject_id"]);
      table.index("created_at");
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("audit_logs");
  }
}
