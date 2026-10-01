import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, Model } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import CreatePostingsTable from "../../database/migrations/2026_10_01_000011_create_postings_table";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const postingColumns = [
  "id",
  "personnel_id",
  "mission_id",
  "starts_on",
  "ends_on",
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

test("postings migration creates the locked schema", async () => {
  const connection = await migrate();
  const columns = await connection.select<ColumnInfo>("pragma table_info(postings)");
  const personnel = await connection.select<ColumnInfo>("pragma table_info(personnel)");
  const foreignKeys = await connection.select<ForeignKeyInfo>(
    "pragma foreign_key_list(postings)",
  );

  expect(columns.map((column) => column.name)).toEqual(postingColumns);
  expect(columns.find((column) => column.name === "starts_on")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "ends_on")?.notnull).toBe(0);
  expect(personnel.map((column) => column.name)).not.toContain("current_posting_id");

  expect(foreignKeys).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        table: "personnel",
        from: "personnel_id",
        on_delete: "RESTRICT",
      }),
      expect.objectContaining({
        table: "missions",
        from: "mission_id",
        on_delete: "RESTRICT",
      }),
    ]),
  );

  const personnelId = await insertPersonnel(connection, "P300");
  const missionId = await insertMission(connection, "Home");
  const otherMissionId = await insertMission(connection, "Embassy of Senegal");

  await insertPosting(connection, personnelId, missionId, null);
  await insertPosting(connection, personnelId, otherMissionId, null);

  await expect(
    connection.execute("delete from personnel where id = ?", [personnelId]),
  ).rejects.toThrow(/foreign key/i);
  await expect(
    connection.execute("delete from missions where id = ?", [missionId]),
  ).rejects.toThrow(/foreign key/i);
});

test("postings migration down drops only the postings table", async () => {
  const connection = await migrate();
  const personnelId = await insertPersonnel(connection, "P301");
  const missionId = await insertMission(connection, "High Commission");

  await insertPosting(connection, personnelId, missionId, "2024-06-01");

  await new CreatePostingsTable().down();

  expect(await tableExists(connection, "postings")).toBe(false);
  expect(await tableExists(connection, "personnel")).toBe(true);
  expect(await tableExists(connection, "missions")).toBe(true);

  const personnel = await connection.select<{ full_name: string }>(
    "select full_name from personnel where id = ?",
    [personnelId],
  );
  expect(personnel[0]?.full_name).toBe("Officer P301");

  await new CreatePostingsTable().up();

  expect(await tableExists(connection, "postings")).toBe(true);
  const columns = await connection.select<ColumnInfo>("pragma table_info(postings)");
  expect(columns.map((column) => column.name)).toEqual(postingColumns);
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

async function insertMission(
  connection: ReturnType<DatabaseManager["connection"]>,
  name: string,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into missions (name, is_home, created_at, updated_at)
     values (?, ?, ?, ?)`,
    [name, name === "Home" ? 1 : 0, "2026-10-01 12:00:00", "2026-10-01 12:00:00"],
  );

  return Number(inserted.lastInsertId);
}

async function insertPosting(
  connection: ReturnType<DatabaseManager["connection"]>,
  personnelId: number,
  missionId: number,
  endsOn: string | null,
): Promise<void> {
  await connection.execute(
    `insert into postings (personnel_id, mission_id, starts_on, ends_on, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?)`,
    [
      personnelId,
      missionId,
      "2020-01-01",
      endsOn,
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
