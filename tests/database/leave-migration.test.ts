import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, Model } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import CreateLeaveApplicationsTable from "../../database/migrations/2026_10_01_000012_create_leave_applications_table";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const leaveColumns = [
  "id",
  "personnel_id",
  "leave_type",
  "starts_on",
  "ends_on",
  "status",
  "created_at",
  "updated_at",
];

type ColumnInfo = {
  name: string;
  notnull: number;
  dflt_value: string | null;
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

test("leave migration creates the locked schema", async () => {
  const connection = await migrate();
  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(leave_applications)",
  );
  const foreignKeys = await connection.select<ForeignKeyInfo>(
    "pragma foreign_key_list(leave_applications)",
  );

  expect(columns.map((column) => column.name)).toEqual(leaveColumns);
  expect(columns.find((column) => column.name === "starts_on")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "ends_on")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "status")?.dflt_value).toBe(
    "'pending'",
  );
  expect(foreignKeys).toEqual([
    expect.objectContaining({
      table: "personnel",
      from: "personnel_id",
      on_delete: "RESTRICT",
    }),
  ]);

  const personnelId = await insertPersonnel(connection, "P400");

  await insertLeave(connection, personnelId, "casual", null);
  await insertLeave(connection, personnelId, "annual", "pending");
  await insertLeave(connection, personnelId, "annual", "approved");

  const rows = await connection.select<{ status: string; leave_type: string }>(
    "select status, leave_type from leave_applications where personnel_id = ? order by id",
    [personnelId],
  );
  expect(rows.map((row) => row.status)).toEqual(["pending", "pending", "approved"]);

  await expect(
    insertLeave(connection, personnelId, "sick", "pending"),
  ).rejects.toThrow(/check constraint/i);
  await expect(
    insertLeave(connection, personnelId, "casual", "completed"),
  ).rejects.toThrow(/check constraint/i);
  await expect(
    connection.execute("delete from personnel where id = ?", [personnelId]),
  ).rejects.toThrow(/foreign key/i);
});

test("leave migration down drops only leave applications", async () => {
  const connection = await migrate();
  const personnelId = await insertPersonnel(connection, "P401");

  await insertLeave(connection, personnelId, "casual", "rejected");
  await new CreateLeaveApplicationsTable().down();

  expect(await tableExists(connection, "leave_applications")).toBe(false);
  expect(await tableExists(connection, "personnel")).toBe(true);
  expect(await tableExists(connection, "postings")).toBe(true);

  const personnel = await connection.select<{ full_name: string }>(
    "select full_name from personnel where id = ?",
    [personnelId],
  );
  expect(personnel[0]?.full_name).toBe("Officer P401");

  await new CreateLeaveApplicationsTable().up();

  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(leave_applications)",
  );
  expect(columns.map((column) => column.name)).toEqual(leaveColumns);
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

async function insertLeave(
  connection: ReturnType<DatabaseManager["connection"]>,
  personnelId: number,
  leaveType: string,
  status: string | null,
): Promise<void> {
  if (status === null) {
    await connection.execute(
      `insert into leave_applications (personnel_id, leave_type, starts_on, ends_on, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?)`,
      [
        personnelId,
        leaveType,
        "2026-11-01",
        "2026-11-05",
        "2026-10-01 12:00:00",
        "2026-10-01 12:00:00",
      ],
    );
    return;
  }

  await connection.execute(
    `insert into leave_applications (personnel_id, leave_type, starts_on, ends_on, status, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, ?)`,
    [
      personnelId,
      leaveType,
      "2026-11-01",
      "2026-11-05",
      status,
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
