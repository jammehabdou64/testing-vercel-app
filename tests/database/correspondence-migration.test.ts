import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, Model } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import CreateCorrespondenceTable from "../../database/migrations/2026_10_01_000014_create_correspondence_table";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const correspondenceColumns = [
  "id",
  "from_mission_id",
  "to_mission_id",
  "body",
  "composed_on",
  "pdf_path",
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

test("correspondence migration creates the locked schema", async () => {
  const connection = await migrate();
  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(correspondence)",
  );
  const foreignKeys = await connection.select<ForeignKeyInfo>(
    "pragma foreign_key_list(correspondence)",
  );

  expect(columns.map((column) => column.name)).toEqual(correspondenceColumns);
  expect(columns.find((column) => column.name === "body")?.notnull).toBe(1);
  expect(columns.find((column) => column.name === "composed_on")?.notnull).toBe(
    1,
  );
  expect(columns.find((column) => column.name === "pdf_path")?.notnull).toBe(1);
  expect(foreignKeys).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        table: "missions",
        from: "from_mission_id",
        on_delete: "RESTRICT",
      }),
      expect.objectContaining({
        table: "missions",
        from: "to_mission_id",
        on_delete: "RESTRICT",
      }),
    ]),
  );

  const homeId = await insertMission(connection, "Home");
  const dakarId = await insertMission(connection, "Embassy in Dakar");

  await insertLetter(connection, homeId, dakarId);
  await expect(insertLetter(connection, homeId, homeId)).rejects.toThrow(
    /check constraint/i,
  );
  await expect(
    connection.execute("delete from missions where id = ?", [homeId]),
  ).rejects.toThrow(/foreign key/i);
  expect(await tableExists(connection, "vacation_notifications")).toBe(true);
});

test("correspondence migration down drops only that table", async () => {
  const connection = await migrate();
  const homeId = await insertMission(connection, "Home");
  const dakarId = await insertMission(connection, "Embassy in Dakar");

  await insertLetter(connection, homeId, dakarId);
  await new CreateCorrespondenceTable().down();

  expect(await tableExists(connection, "correspondence")).toBe(false);
  expect(await tableExists(connection, "missions")).toBe(true);
  expect(await tableExists(connection, "leave_applications")).toBe(true);

  const missions = await connection.select<{ name: string }>(
    "select name from missions where id = ?",
    [homeId],
  );
  expect(missions[0]?.name).toBe("Home");

  await new CreateCorrespondenceTable().up();

  const columns = await connection.select<ColumnInfo>(
    "pragma table_info(correspondence)",
  );
  expect(columns.map((column) => column.name)).toEqual(correspondenceColumns);
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

async function insertMission(
  connection: ReturnType<DatabaseManager["connection"]>,
  name: string,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into missions (name, is_home, created_at, updated_at)
     values (?, ?, ?, ?)`,
    [
      name,
      name === "Home" ? 1 : 0,
      "2026-10-01 12:00:00",
      "2026-10-01 12:00:00",
    ],
  );

  return Number(inserted.lastInsertId);
}

async function insertLetter(
  connection: ReturnType<DatabaseManager["connection"]>,
  fromMissionId: number,
  toMissionId: number,
): Promise<void> {
  await connection.execute(
    `insert into correspondence (
       from_mission_id, to_mission_id, body, composed_on, pdf_path, created_at, updated_at
     ) values (?, ?, ?, ?, ?, ?, ?)`,
    [
      fromMissionId,
      toMissionId,
      "The mission writes to confirm receipt.",
      "2026-10-01",
      "correspondence/1.pdf",
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
