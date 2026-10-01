import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, Model } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import CreateVacationNotificationsTable from "../../database/migrations/2026_10_01_000013_create_vacation_notifications_table";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const vacationColumns = [
  "id",
  "personnel_id",
  "travelling_country",
  "reason",
  "submitted_on",
  "created_at",
  "updated_at",
];

type ColumnInfo = {
  name: string;
  notnull: number;
};

type ForeignKeyInfo = {
  table: string;
  from: string;
  on_delete: string;
};

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("vacation notification migration creates the locked schema", async () => {
  const connection = await migrate();
  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(vacation_notifications)",
  );
  const foreignKeys = await connection.select<ForeignKeyInfo>(
    "pragma foreign_key_list(vacation_notifications)",
  );

  expect(columns.map((column) => column.name)).toEqual(vacationColumns);
  expect(columns.find((column) => column.name === "travelling_country")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "reason")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "submitted_on")?.notnull).toBe(1);
  expect(foreignKeys).toEqual([
    expect.objectContaining({
      table: "personnel",
      from: "personnel_id",
      on_delete: "RESTRICT",
    }),
  ]);

  const personnelId = await insertPersonnel(connection, "P500");

  await insertNotification(connection, personnelId, "Senegal", "Family visit");
  await insertNotification(connection, personnelId, "Senegal", "Conference");

  const rows = await connection.select<{ travelling_country: string }>(
    "select travelling_country from vacation_notifications where personnel_id = ?",
    [personnelId],
  );
  expect(rows).toHaveLength(2);

  await expect(
    connection.execute("delete from personnel where id = ?", [personnelId]),
  ).rejects.toThrow(/foreign key/i);
  expect(await tableExists(connection, "leave_applications")).toBe(true);
});

test("vacation notification migration down drops only that table", async () => {
  const connection = await migrate();
  const personnelId = await insertPersonnel(connection, "P501");

  await insertNotification(connection, personnelId, "Ghana", "Official travel");
  await new CreateVacationNotificationsTable().down();

  expect(await tableExists(connection, "vacation_notifications")).toBe(false);
  expect(await tableExists(connection, "leave_applications")).toBe(true);
  expect(await tableExists(connection, "personnel")).toBe(true);

  const personnel = await connection.select<{ full_name: string }>(
    "select full_name from personnel where id = ?",
    [personnelId],
  );
  expect(personnel[0]?.full_name).toBe("Officer P501");

  await new CreateVacationNotificationsTable().up();

  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(vacation_notifications)",
  );
  expect(columns.map((column) => column.name)).toEqual(vacationColumns);
});

async function migrate() {
  database = new DatabaseManager({
    default: "sqlite",
    connections: {
      sqlite: { driver: "sqlite", database: ":memory:" },
    },
  });
  Model.useDatabase(database);
  setDatabaseManager(database);

  const connection = database.connection();
  await new Migrator(connection, migrationsDirectory).run();
  await connection.execute("pragma foreign_keys = on");

  return connection;
}

async function insertPersonnel(
  connection: ReturnType<DatabaseManager["connection"]>,
  passport: string,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?)`,
    [
      `Officer ${passport}`,
      "1980-01-02",
      passport,
      "Counsellor",
      "2026-10-01 12:00:00",
      "2026-10-01 12:00:00",
    ],
  );

  return Number(inserted.lastInsertId);
}

async function insertNotification(
  connection: ReturnType<DatabaseManager["connection"]>,
  personnelId: number,
  country: string,
  reason: string,
): Promise<void> {
  await connection.execute(
    `insert into vacation_notifications (
       personnel_id, travelling_country, reason, submitted_on, created_at, updated_at
     ) values (?, ?, ?, ?, ?, ?)`,
    [
      personnelId,
      country,
      reason,
      "2026-10-01",
      "2026-10-01 12:00:00",
      "2026-10-01 12:00:00",
    ],
  );
}

async function tableExists(
  connection: ReturnType<DatabaseManager["connection"]>,
  table: string,
): Promise<boolean> {
  const rows = await connection.select<{ name: string }>(
    "select name from sqlite_master where type = 'table' and name = ?",
    [table],
  );

  return rows.length === 1;
}
