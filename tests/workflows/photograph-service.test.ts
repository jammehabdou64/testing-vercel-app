import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model, type Connection } from "bun-jcc";
import { FilesystemManager } from "bun-jcc/Filesystem/FilesystemManager";
import type { FilesystemAdapter } from "bun-jcc/Filesystem/FilesystemAdapter";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import type { PhotographActor, PhotographFile } from "../../app/Services/PhotographService";
import { PhotographService } from "../../app/Services/PhotographService";
import { PhotographUploadError } from "../../app/Services/PhotographUploadError";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("an administrator can replace a personnel photograph", async () => {
  const { service, disk, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: jpeg,
    filename: "portrait.jpg",
  });

  expect(replaced.photographPath).toMatch(
    new RegExp(`^photographs/personnel/${personnelId}/[0-9a-f-]+\\.jpg$`),
  );
  expect(await disk.exists(replaced.photographPath)).toBe(true);
  expect(await disk.size(replaced.photographPath)).toBe(jpeg.byteLength);
  const row = await connection
    .table<{ photograph_path: string }>("personnel")
    .where("id", personnelId)
    .first();
  expect(row?.photograph_path).toBe(replaced.photographPath);
});

test("a non-administrator cannot replace a personnel photograph", async () => {
  const { service, disk, personnelId, connection } = await boot();

  for (const actor of nonAdministrators(personnelId)) {
    await expect(
      service.replacePersonnel(actor, personnelId, { bytes: jpeg }),
    ).rejects.toBeInstanceOf(HttpException);
  }

  expect(await disk.allFiles()).toHaveLength(0);
  const row = await connection
    .table<{ photograph_path: string | null }>("personnel")
    .where("id", personnelId)
    .first();
  expect(row?.photograph_path).toBeNull();
});

test("an administrator can replace a diplomatic staff photograph", async () => {
  const { service, disk, staffId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");

  const replaced = await service.replaceDiplomaticStaff(administrator(userId), staffId, {
    bytes: png,
    filename: "staff.jpg",
    contentType: "image/jpeg",
  });

  expect(replaced.photographPath).toMatch(
    new RegExp(`^photographs/diplomatic-staff/${staffId}/[0-9a-f-]+\\.png$`),
  );
  expect(replaced.photographPath.includes("staff.jpg")).toBe(false);
  expect(await disk.exists(replaced.photographPath)).toBe(true);
});

test("a non-administrator cannot replace a diplomatic staff photograph", async () => {
  const { service, disk, personnelId, staffId, connection } = await boot();

  for (const actor of nonAdministrators(personnelId)) {
    await expect(
      service.replaceDiplomaticStaff(actor, staffId, { bytes: png }),
    ).rejects.toBeInstanceOf(HttpException);
  }

  expect(await disk.allFiles()).toHaveLength(0);
  const row = await connection
    .table<{ photograph_path: string | null }>("foreign_diplomatic_staff")
    .where("id", staffId)
    .first();
  expect(row?.photograph_path).toBeNull();
});

test("a valid JPEG is accepted", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: jpeg,
  });

  expect(replaced.photographPath.endsWith(".jpg")).toBe(true);
});

test("a valid PNG is accepted", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: png,
    filename: "photo.jpg",
  });

  expect(replaced.photographPath.endsWith(".png")).toBe(true);
});

test("invalid image bytes are rejected even with a jpg filename", async () => {
  const { service, disk, personnelId } = await boot();
  const file: PhotographFile = { bytes: gif, filename: "portrait.jpg" };

  await expect(
    service.replacePersonnel(administrator(null), personnelId, file),
  ).rejects.toBeInstanceOf(PhotographUploadError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("invalid image bytes are rejected even with an image/jpeg content type", async () => {
  const { service, disk, personnelId } = await boot();
  const file: PhotographFile = {
    bytes: gif,
    filename: "portrait.png",
    contentType: "image/jpeg",
  };

  await expect(
    service.replacePersonnel(administrator(null), personnelId, file),
  ).rejects.toBeInstanceOf(PhotographUploadError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("a file larger than 2 MiB is rejected", async () => {
  const { service, disk, personnelId } = await boot();
  const bytes = new Uint8Array(2_097_153);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;

  await expect(
    service.replacePersonnel(administrator(null), personnelId, { bytes }),
  ).rejects.toBeInstanceOf(PhotographUploadError);
  expect(await disk.allFiles()).toHaveLength(0);
});

test("the stored name is generated from the file bytes", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: jpeg,
    filename: "../secret/client-name.jpg",
    contentType: "image/png",
  });

  expect(replaced.photographPath.includes("secret")).toBe(false);
  expect(replaced.photographPath.includes("client-name")).toBe(false);
  expect(replaced.photographPath.endsWith(".jpg")).toBe(true);
});

test("the audit row records the previous path and the new path", async () => {
  const { service, disk, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");
  const previous = `photographs/personnel/${personnelId}/previous.jpg`;
  await disk.put(previous, jpeg);
  await connection
    .table("personnel")
    .where("id", personnelId)
    .update({ photograph_path: previous });

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: png,
    filename: "next.jpg",
  });

  const audit = await connection
    .table<{
      user_id: number | null;
      action: string;
      module: string;
      subject_type: string;
      subject_id: number;
      before: unknown;
      after: unknown;
    }>("audit_logs")
    .get();
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({
    user_id: userId,
    action: "photograph.replaced",
    module: "personnel",
    subject_type: "personnel",
    subject_id: personnelId,
  });
  expect(jsonValue(audit[0]?.before)).toEqual({ photograph_path: previous });
  expect(jsonValue(audit[0]?.after)).toMatchObject({
    photograph_path: replaced.photographPath,
  });
  expect(JSON.stringify(audit[0]?.after)).not.toContain("password");
  expect(JSON.stringify(audit[0]?.before)).not.toContain("%PNG");
});

test("a failed database transaction removes the new file and keeps the previous file", async () => {
  const { service, disk, personnelId, connection } = await boot();
  const previous = `photographs/personnel/${personnelId}/previous.jpg`;
  await disk.put(previous, jpeg);
  await connection
    .table("personnel")
    .where("id", personnelId)
    .update({ photograph_path: previous });

  await expect(
    service.replacePersonnel(administrator(99999), personnelId, { bytes: png }),
  ).rejects.toThrow();

  expect(await disk.exists(previous)).toBe(true);
  expect(await disk.allFiles()).toEqual([previous]);
  const row = await connection
    .table<{ photograph_path: string }>("personnel")
    .where("id", personnelId)
    .first();
  expect(row?.photograph_path).toBe(previous);
  expect(await connection.table("audit_logs").get()).toHaveLength(0);
});

test("the previous file is removed after the new photograph commits", async () => {
  const { service, disk, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "admin@example.test");
  const previous = `photographs/personnel/${personnelId}/previous.jpg`;
  await disk.put(previous, jpeg);
  await connection
    .table("personnel")
    .where("id", personnelId)
    .update({ photograph_path: previous });

  const replaced = await service.replacePersonnel(administrator(userId), personnelId, {
    bytes: jpeg,
  });

  expect(await disk.exists(previous)).toBe(false);
  expect(await disk.exists(replaced.photographPath)).toBe(true);
  expect(await disk.allFiles()).toEqual([replaced.photographPath]);
});

test("an audit failure leaves the previous photograph intact", async () => {
  const { service, disk, personnelId, connection } = await boot();
  const previous = `photographs/personnel/${personnelId}/previous.jpg`;
  await disk.put(previous, jpeg);
  await connection
    .table("personnel")
    .where("id", personnelId)
    .update({ photograph_path: previous });

  await expect(
    service.replacePersonnel(administrator(99999), personnelId, { bytes: jpeg }),
  ).rejects.toThrow();

  expect(await disk.exists(previous)).toBe(true);
  expect(await disk.allFiles()).toEqual([previous]);
  const row = await connection
    .table<{ photograph_path: string }>("personnel")
    .where("id", personnelId)
    .first();
  expect(row?.photograph_path).toBe(previous);
});

function administrator(userId: number | null): PhotographActor {
  return {
    role: RoleSlug.Administrator,
    personnelId: null,
    missionId: null,
    userId,
  };
}

function nonAdministrators(personnelId: number): PhotographActor[] {
  return [
    {
      role: RoleSlug.ForeignServiceOfficer,
      personnelId,
      missionId: null,
      userId: null,
    },
    {
      role: RoleSlug.HonorableMinister,
      personnelId: null,
      missionId: null,
      userId: null,
    },
    {
      role: RoleSlug.PermanentSecretary,
      personnelId: null,
      missionId: null,
      userId: null,
    },
    {
      role: RoleSlug.MissionPostUser,
      personnelId: null,
      missionId: 1,
      userId: null,
    },
  ];
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
  const missionId = await insertForeignMission(connection);
  const staffId = await insertStaff(connection, missionId);
  const disk = privateDisk();

  return {
    connection,
    disk,
    personnelId,
    staffId,
    service: new PhotographService(connection, disk),
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
     values ('Ama Jallow', '1980-01-02', 'P900', 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );
  return Number(inserted.lastInsertId);
}

async function insertForeignMission(connection: Connection): Promise<number> {
  const inserted = await connection.execute(
    `insert into foreign_diplomatic_missions (name, country, address, email, phone, created_at, updated_at)
     values ('Embassy of Senegal', 'Senegal', 'Pipeline', 'dakar@example.test', '4390000', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );
  return Number(inserted.lastInsertId);
}

async function insertStaff(connection: Connection, missionId: number): Promise<number> {
  const inserted = await connection.execute(
    `insert into foreign_diplomatic_staff (
       foreign_diplomatic_mission_id, full_name, nationality, passport_number, designation,
       country_represented, accreditation_starts_on, created_at, updated_at
     ) values (?, 'Aminata Diop', 'Senegalese', 'SN1', 'Counsellor', 'Senegal', '2024-01-01', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [missionId],
  );
  return Number(inserted.lastInsertId);
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
