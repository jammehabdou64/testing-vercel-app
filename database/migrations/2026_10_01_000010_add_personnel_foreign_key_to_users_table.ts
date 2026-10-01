import { DB, Migration, Schema } from "bun-jcc";
import type { Blueprint } from "bun-jcc/Database/Schema/Blueprint";

const carriedColumns = [
  "id",
  "name",
  "email",
  "password",
  "email_verified_at",
  "created_at",
  "updated_at",
  "role_id",
  "personnel_id",
  "mission_id",
] as const;

/**
 * SQLite cannot add a foreign key with ALTER TABLE. The users table is
 * rebuilt so personnel_id references personnel. Existing rows are copied.
 * audit_logs already references users, so foreign keys are off only while
 * the old table is dropped and the new one is renamed into its place.
 */
export default class AddPersonnelForeignKeyToUsersTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("users_with_personnel_fk", (table) => {
      this.accountColumns(table);
      this.linkColumns(table, true);
    });

    await this.copyUsers("users", "users_with_personnel_fk");
    await this.replaceUsers("users_with_personnel_fk");
    await this.renameIndexes("users_with_personnel_fk");
  }

  async down(): Promise<void> {
    await Schema.create("users_without_personnel_fk", (table) => {
      this.accountColumns(table);
      this.linkColumns(table, false);
    });

    await this.copyUsers("users", "users_without_personnel_fk");
    await this.replaceUsers("users_without_personnel_fk");
    await this.renameIndexes("users_without_personnel_fk");
  }

  private accountColumns(table: Blueprint): void {
    table.id();
    table.string("name");
    table.string("email").unique();
    table.string("password");
    table.timestamp("email_verified_at").nullable();
    table.nullableTimestamps();
  }

  private linkColumns(table: Blueprint, personnelForeignKey: boolean): void {
    table.foreignId("role_id").nullable().constrained("roles").restrictOnDelete();

    if (personnelForeignKey) {
      table
        .foreignId("personnel_id")
        .nullable()
        .constrained("personnel")
        .restrictOnDelete();
    } else {
      table.unsignedBigInteger("personnel_id").nullable().index();
    }

    table
      .foreignId("mission_id")
      .nullable()
      .constrained("missions")
      .restrictOnDelete();
  }

  private async copyUsers(from: string, to: string): Promise<void> {
    const rows = await DB.table(from)
      .select(...carriedColumns)
      .get();

    await DB.table(to).insert(rows);
  }

  private async replaceUsers(replacement: string): Promise<void> {
    await DB.execute("pragma foreign_keys = off");

    try {
      await Schema.drop("users");
      await Schema.rename(replacement, "users");
    } finally {
      await DB.execute("pragma foreign_keys = on");
    }
  }

  private async renameIndexes(previousTable: string): Promise<void> {
    await Schema.table("users", (table) => {
      table.dropIndex(`${previousTable}_role_id_index`);
      table.dropIndex(`${previousTable}_personnel_id_index`);
      table.dropIndex(`${previousTable}_mission_id_index`);
      table.index("role_id");
      table.index("personnel_id");
      table.index("mission_id");
    });
  }
}
