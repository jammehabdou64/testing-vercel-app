import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import type { Actor } from "../../app/Auth/Actor";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { PostingAssignmentError } from "../../app/Services/PostingAssignmentError";
import { postingDuration } from "../../app/Services/PostingDuration";
import { PostingService } from "../../app/Services/PostingService";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const administrator: Actor = {
  role: RoleSlug.Administrator,
  personnelId: null,
  missionId: null,
};

const officer: Actor = {
  role: RoleSlug.ForeignServiceOfficer,
  personnelId: 1,
  missionId: null,
};

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("reassignment closes the open posting and keeps the closed row", async () => {
  const { service, personnelId, homeId, dakarId } = await scenario();

  await service.assign(administrator, {
    personnelId,
    missionId: homeId,
    startsOn: "2020-01-01",
  });
  await service.assign(administrator, {
    personnelId,
    missionId: dakarId,
    startsOn: "2024-06-01",
  });

  const rows = await database!.connection()
    .table<{ mission_id: number; starts_on: string; ends_on: string | null }>("postings")
    .where("personnel_id", personnelId)
    .orderBy("id")
    .get();

  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    mission_id: homeId,
    starts_on: "2020-01-01",
    ends_on: "2024-05-31",
  });
  expect(rows[1]).toMatchObject({
    mission_id: dakarId,
    starts_on: "2024-06-01",
    ends_on: null,
  });
});

test("reassignment rolls back when the new posting cannot be saved", async () => {
  const { service, personnelId, homeId } = await scenario();

  await service.assign(administrator, {
    personnelId,
    missionId: homeId,
    startsOn: "2020-01-01",
  });

  await expect(
    service.assign(administrator, {
      personnelId,
      missionId: 99999,
      startsOn: "2024-06-01",
    }),
  ).rejects.toThrow();

  const rows = await database!.connection()
    .table<{ ends_on: string | null }>("postings")
    .where("personnel_id", personnelId)
    .get();

  expect(rows).toHaveLength(1);
  expect(rows[0]?.ends_on).toBeNull();
});

test("a service refuses a second open posting for the same officer", async () => {
  const { service, personnelId, homeId, dakarId, connection } = await scenario();

  await connection.execute(
    `insert into postings (personnel_id, mission_id, starts_on, ends_on, created_at, updated_at)
     values (?, ?, '2020-01-01', null, '2026-10-01 12:00:00', '2026-10-01 12:00:00'),
            (?, ?, '2021-01-01', null, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [personnelId, homeId, personnelId, dakarId],
  );

  await expect(
    service.assign(administrator, {
      personnelId,
      missionId: homeId,
      startsOn: "2024-06-01",
    }),
  ).rejects.toBeInstanceOf(PostingAssignmentError);

  const open = await connection
    .table("postings")
    .where("personnel_id", personnelId)
    .whereNull("ends_on")
    .get();

  expect(open).toHaveLength(2);
});

test("an officer cannot reassign a posting", async () => {
  const { service, personnelId, homeId } = await scenario();

  await expect(
    service.assign(officer, {
      personnelId,
      missionId: homeId,
      startsOn: "2020-01-01",
    }),
  ).rejects.toBeInstanceOf(HttpException);
});

test("posting duration is calculated from the start date to the end date", () => {
  expect(postingDuration("2020-01-15", "2022-03-15", "2026-10-01")).toEqual({
    years: 2,
    months: 2,
  });
  expect(postingDuration("2020-01-15", null, "2022-03-15")).toEqual({
    years: 2,
    months: 2,
  });
  expect(postingDuration("2020-01-15", "2020-01-15", "2026-10-01")).toEqual({
    years: 0,
    months: 0,
  });
});

async function scenario() {
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

  const personnel = await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values ('Ama Jallow', '1980-01-02', 'P700', 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );
  const home = await connection.execute(
    `insert into missions (name, is_home, created_at, updated_at)
     values ('Home', 1, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );
  const dakar = await connection.execute(
    `insert into missions (name, is_home, created_at, updated_at)
     values ('Embassy in Dakar', 0, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );

  return {
    connection,
    service: new PostingService(connection),
    personnelId: Number(personnel.lastInsertId),
    homeId: Number(home.lastInsertId),
    dakarId: Number(dakar.lastInsertId),
  };
}
