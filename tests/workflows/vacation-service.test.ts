import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model, type Connection } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import type { VacationActor } from "../../app/Services/VacationNotificationService";
import { VacationNotificationService } from "../../app/Services/VacationNotificationService";
import { VacationWorkflowError } from "../../app/Services/VacationWorkflowError";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("an officer files a notice for their own personnel record", async () => {
  const { service, personnelId } = await boot();

  const row = await service.file(officer(personnelId), {
    travellingCountry: " Senegal ",
    reason: " Family visit ",
    submittedOn: "2026-10-01",
  });

  expect(row).toMatchObject({
    personnel_id: personnelId,
    travelling_country: "Senegal",
    reason: "Family visit",
    submitted_on: "2026-10-01",
  });
  expect(row).not.toHaveProperty("full_name");
  expect(row).not.toHaveProperty("designation");
});

test("a blank country or reason is refused", async () => {
  const { service, personnelId, connection } = await boot();

  await expect(
    service.file(officer(personnelId), {
      travellingCountry: "   ",
      reason: "Visit",
      submittedOn: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(VacationWorkflowError);

  expect(await connection.table("vacation_notifications").get()).toHaveLength(0);
});

test("an invalid submission date is refused", async () => {
  const { service, personnelId, connection } = await boot();

  await expect(
    service.file(officer(personnelId), {
      travellingCountry: "Senegal",
      reason: "Visit",
      submittedOn: "2026-02-31",
    }),
  ).rejects.toBeInstanceOf(VacationWorkflowError);

  expect(await connection.table("vacation_notifications").get()).toHaveLength(0);
});

test("an administrator cannot file", async () => {
  const { service, personnelId } = await boot();

  await expect(
    service.file(actor(RoleSlug.Administrator, personnelId), {
      travellingCountry: "Senegal",
      reason: "Visit",
      submittedOn: "2026-10-01",
    }),
  ).rejects.toBeInstanceOf(HttpException);
});

test("the officer and an administrator can see the notice, and other viewers cannot", async () => {
  const { service, personnelId, connection } = await boot();
  const otherId = await insertPersonnel(connection, "Other Officer", "P801");
  await service.file(officer(personnelId), {
    travellingCountry: "Senegal",
    reason: "Family visit",
    submittedOn: "2026-10-01",
  });

  expect(await service.visibleTo(officer(personnelId))).toHaveLength(1);
  expect(await service.visibleTo(actor(RoleSlug.Administrator, null))).toHaveLength(1);
  expect(await service.visibleTo(officer(otherId))).toHaveLength(0);
  expect(await service.visibleTo(actor(RoleSlug.HonorableMinister, null))).toHaveLength(0);
  expect(await service.visibleTo(actor(RoleSlug.PermanentSecretary, null))).toHaveLength(0);
  expect(await service.visibleTo(actor(RoleSlug.MissionPostUser, null))).toHaveLength(0);
});

function officer(personnelId: number): VacationActor {
  return actor(RoleSlug.ForeignServiceOfficer, personnelId);
}

function actor(role: RoleSlug, personnelId: number | null): VacationActor {
  return {
    role,
    personnelId,
    missionId: null,
    userId: null,
  };
}

async function boot() {
  if (database) {
    await database.disconnect();
  }

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
  const personnelId = await insertPersonnel(connection, "Ama Jallow", "P800");

  return {
    connection,
    personnelId,
    service: new VacationNotificationService(connection),
  };
}

async function insertPersonnel(
  connection: Connection,
  name: string,
  passport: string,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values (?, '1980-01-02', ?, 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [name, passport],
  );
  return Number(inserted.lastInsertId);
}
