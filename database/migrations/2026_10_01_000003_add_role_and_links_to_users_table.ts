import { DB, Migration, Schema } from "bun-jcc";

const carriedColumns = [
  "id",
  "name",
  "email",
  "password",
  "email_verified_at",
  "created_at",
  "updated_at",
] as const;

/**
 * SQLite cannot add a foreign key with ALTER TABLE, and that is the
 * configured driver. The users table is rebuilt so role_id and mission_id
 * can reference roles and missions.
 *
 * personnel_id stays a plain column until the personnel table exists.
 * Role-to-link rules are enforced with account management, not a check constraint.
 */
export default class AddRoleAndLinksToUsersTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("users_with_links", (table) => {
      this.baseColumns(table);
      table
        .foreignId("role_id")
        .nullable()
        .constrained("roles")
        .restrictOnDelete();
      table.unsignedBigInteger("personnel_id").nullable().index();
      table
        .foreignId("mission_id")
        .nullable()
        .constrained("missions")
        .restrictOnDelete();
    });

    await this.copyUsers("users", "users_with_links");
    await Schema.drop("users");
    await Schema.rename("users_with_links", "users");
    await this.renameLinkIndexes();
  }

  async down(): Promise<void> {
    await Schema.create("users_without_links", (table) => {
      this.baseColumns(table);
    });

    await this.copyUsers("users", "users_without_links");
    await Schema.drop("users");
    await Schema.rename("users_without_links", "users");
  }

  private baseColumns(table: {
    id: () => unknown;
    string: (column: string) => { unique: () => unknown };
    timestamp: (column: string) => { nullable: () => unknown };
    nullableTimestamps: () => void;
  }): void {
    table.id();
    table.string("name");
    table.string("email").unique();
    table.string("password");
    table.timestamp("email_verified_at").nullable();
    table.nullableTimestamps();
  }

  private async renameLinkIndexes(): Promise<void> {
    await Schema.table("users", (table) => {
      table.dropIndex("users_with_links_role_id_index");
      table.dropIndex("users_with_links_personnel_id_index");
      table.dropIndex("users_with_links_mission_id_index");
      table.index("role_id");
      table.index("personnel_id");
      table.index("mission_id");
    });
  }

  private async copyUsers(from: string, to: string): Promise<void> {
    const rows = await DB.table(from)
      .select(...carriedColumns)
      .get();

    await DB.table(to).insert(rows);
  }
}
