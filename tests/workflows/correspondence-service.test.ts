import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model, type Connection } from "bun-jcc";
import { FilesystemManager } from "bun-jcc/Filesystem/FilesystemManager";
import type { FilesystemAdapter } from "bun-jcc/Filesystem/FilesystemAdapter";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import type { CorrespondenceActor } from "../../app/Services/CorrespondenceService";
import { CorrespondenceService } from "../../app/Services/CorrespondenceService";
import { CorrespondenceWorkflowError } from "../../app/Services/CorrespondenceWorkflowError";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("composing stores one correspondence row and a private pdf path", async () => {
  const { service, disk, homeId, dakarId, connection } = await boot();

  const row = await service.compose(missionUser(dakarId), {
    toMissionId: homeId,
    body: "Request for cover.",
    composedOn: "2026-10-01",
  });

  expect(row).toMatchObject({
    from_mission_id: dakarId,
    to_mission_id: homeId,
    body: "Request for cover.",
    composed_on: "2026-10-01",
  });
  expect(row.pdf_path).toMatch(/^correspondence\/.+\.pdf$/);
  expect(row.pdf_path.includes("%PDF")).toBe(false);

  const stored = await connection
    .table<Record<string, unknown>>("correspondence")
    .where("id", row.id)
    .first();
  expect(stored?.pdf_path).toBe(row.pdf_path);
  expect(stored).not.toHaveProperty("pdf");

  const pdf = await disk.get(row.pdf_path);
  expect(pdf?.startsWith("%PDF")).toBe(true);
  expect(pdf).toContain("From: Embassy in Dakar");
  expect(pdf).toContain("To: Home");
  expect(pdf).toContain("Date: 2026-10-01");
  expect(pdf).toContain("Request for cover.");
  expect(await disk.allFiles()).toEqual([row.pdf_path]);
});

test("a foreign service officer composes from the mission of their single open posting", async () => {
  const { service, personnelId, homeId, dakarId, connection } = await boot();
  await insertPosting(connection, personnelId, homeId);

  const row = await service.compose(officer(personnelId), {
    toMissionId: dakarId,
    body: "Note from headquarters.",
    composedOn: "2026-10-02",
  });

  expect(row.from_mission_id).toBe(homeId);
  expect(row.to_mission_id).toBe(dakarId);
});

test("an officer with no open posting cannot compose", async () => {
  const { service, personnelId, dakarId, disk } = await boot();

  await expect(
    service.compose(officer(personnelId), {
      toMissionId: dakarId,
      body: "No posting.",
      composedOn: "2026-10-02",
    }),
  ).rejects.toBeInstanceOf(HttpException);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("an officer with two open postings cannot compose", async () => {
  const { service, personnelId, homeId, dakarId, londonId, connection, disk } = await boot();
  await insertPosting(connection, personnelId, homeId);
  await insertPosting(connection, personnelId, dakarId);

  await expect(
    service.compose(officer(personnelId), {
      toMissionId: londonId,
      body: "Ambiguous posting.",
      composedOn: "2026-10-02",
    }),
  ).rejects.toBeInstanceOf(HttpException);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("a letter to the same mission is refused and no file is stored", async () => {
  const { service, dakarId, disk } = await boot();

  await expect(
    service.compose(missionUser(dakarId), {
      toMissionId: dakarId,
      body: "To ourselves.",
      composedOn: "2026-10-02",
    }),
  ).rejects.toBeInstanceOf(CorrespondenceWorkflowError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("an unknown recipient is refused and no file is stored", async () => {
  const { service, dakarId, disk } = await boot();

  await expect(
    service.compose(missionUser(dakarId), {
      toMissionId: 99999,
      body: "Missing mission.",
      composedOn: "2026-10-02",
    }),
  ).rejects.toBeInstanceOf(CorrespondenceWorkflowError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("an empty letter is refused and no file is stored", async () => {
  const { service, homeId, dakarId, disk } = await boot();

  await expect(
    service.compose(missionUser(dakarId), {
      toMissionId: homeId,
      body: "   ",
      composedOn: "2026-10-02",
    }),
  ).rejects.toBeInstanceOf(CorrespondenceWorkflowError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("administrator, minister, and permanent secretary cannot compose", async () => {
  const { service, homeId, disk } = await boot();
  const actors: CorrespondenceActor[] = [
    { role: RoleSlug.Administrator, personnelId: null, missionId: null, userId: null },
    { role: RoleSlug.HonorableMinister, personnelId: null, missionId: null, userId: null },
    { role: RoleSlug.PermanentSecretary, personnelId: null, missionId: null, userId: null },
  ];

  for (const actor of actors) {
    await expect(
      service.compose(actor, {
        toMissionId: homeId,
        body: "Not a mission party.",
        composedOn: "2026-10-02",
      }),
    ).rejects.toBeInstanceOf(HttpException);
  }

  expect(await disk.allFiles()).toHaveLength(0);
});

test("a database failure after the pdf is stored removes the file", async () => {
  const { service, homeId, dakarId, disk, connection } = await boot();

  await expect(
    service.compose(missionUser(dakarId, 99999), {
      toMissionId: homeId,
      body: "This audit user does not exist.",
      composedOn: "2026-10-02",
    }),
  ).rejects.toThrow();

  expect(await connection.table("correspondence").get()).toHaveLength(0);
  expect(await connection.table("audit_logs").get()).toHaveLength(0);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("composing writes the audit row with the letter and not the pdf bytes", async () => {
  const { service, homeId, dakarId, connection } = await boot();
  const userId = await insertUser(connection, "dakar@example.test");
  const row = await service.compose(missionUser(dakarId, userId), {
    toMissionId: homeId,
    body: "Audited note.",
    composedOn: "2026-10-03",
  });

  const audit = await connection.table<{
    user_id: number | null;
    action: string;
    module: string;
    subject_type: string;
    subject_id: number;
    before: unknown;
    after: unknown;
  }>("audit_logs").get();

  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({
    user_id: userId,
    action: "correspondence.composed",
    module: "correspondence",
    subject_type: "correspondence",
    subject_id: row.id,
    before: null,
  });
  const after = jsonValue(audit[0]?.after) as Record<string, unknown>;
  expect(after).toMatchObject({
    from_mission_id: dakarId,
    to_mission_id: homeId,
    body: "Audited note.",
    pdf_path: row.pdf_path,
  });
  expect(JSON.stringify(after)).not.toContain("%PDF");
  expect(JSON.stringify(after)).not.toContain("password");
});

test("a Home officer does not see letters sent between two other missions", async () => {
  const { service, personnelId, homeId, dakarId, londonId, connection } = await boot();
  await insertPosting(connection, personnelId, homeId);
  const homeOfficer = officer(personnelId);
  const dakar = missionUser(dakarId);

  await service.compose(dakar, {
    toMissionId: londonId,
    body: "Between other missions.",
    composedOn: "2026-10-04",
  });
  expect(await service.visibleTo(homeOfficer)).toHaveLength(0);

  await service.compose(dakar, {
    toMissionId: homeId,
    body: "To headquarters.",
    composedOn: "2026-10-05",
  });
  await service.compose(homeOfficer, {
    toMissionId: dakarId,
    body: "From headquarters.",
    composedOn: "2026-10-06",
  });

  const visible = await service.visibleTo(homeOfficer);
  expect(visible.map((letter) => letter.body).sort()).toEqual([
    "From headquarters.",
    "To headquarters.",
  ]);
  expect(await connection.table("correspondence").get()).toHaveLength(3);

  const minister: CorrespondenceActor = {
    role: RoleSlug.HonorableMinister,
    personnelId: null,
    missionId: null,
    userId: null,
  };
  expect(await service.visibleTo(minister)).toHaveLength(0);
});

function officer(personnelId: number, userId: number | null = null): CorrespondenceActor {
  return {
    role: RoleSlug.ForeignServiceOfficer,
    personnelId,
    missionId: null,
    userId,
  };
}

function missionUser(missionId: number, userId: number | null = null): CorrespondenceActor {
  return {
    role: RoleSlug.MissionPostUser,
    personnelId: null,
    missionId,
    userId,
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

  const personnelId = await insertPersonnel(connection);
  const homeId = await insertMission(connection, "Home", true);
  const dakarId = await insertMission(connection, "Embassy in Dakar", false);
  const londonId = await insertMission(connection, "High Commission in London", false);
  const disk = privateDisk();

  return {
    connection,
    disk,
    personnelId,
    homeId,
    dakarId,
    londonId,
    service: new CorrespondenceService(connection, disk),
  };
}

function privateDisk(): FilesystemAdapter {
  return new FilesystemManager(
    {
      default: "local",
      disks: {
        local: { driver: "local", root: "storage/app/private" },
      },
      links: {},
    },
    import.meta.dir,
  ).fake("local");
}

async function insertPersonnel(connection: Connection): Promise<number> {
  const inserted = await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values ('Ama Jallow', '1980-01-02', 'P800', 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );
  return Number(inserted.lastInsertId);
}

async function insertMission(connection: Connection, name: string, isHome: boolean): Promise<number> {
  const inserted = await connection.execute(
    `insert into missions (name, is_home, created_at, updated_at)
     values (?, ?, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [name, isHome ? 1 : 0],
  );
  return Number(inserted.lastInsertId);
}

async function insertPosting(
  connection: Connection,
  personnelId: number,
  missionId: number,
): Promise<void> {
  await connection.execute(
    `insert into postings (personnel_id, mission_id, starts_on, ends_on, created_at, updated_at)
     values (?, ?, '2020-01-01', null, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [personnelId, missionId],
  );
}

async function insertUser(connection: Connection, email: string): Promise<number> {
  const inserted = await connection.execute(
    `insert into users (name, email, password, created_at, updated_at)
     values ('Test User', ?, 'hashed-secret', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [email],
  );
  return Number(inserted.lastInsertId);
}

function jsonValue(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) : value;
}
