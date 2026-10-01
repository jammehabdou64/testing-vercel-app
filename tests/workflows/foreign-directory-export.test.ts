import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model, type Connection } from "bun-jcc";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import type { Actor } from "../../app/Auth/Actor";
import type { ForeignDirectoryDocument } from "../../app/Services/ForeignDirectoryPdf";
import { ForeignDirectoryExportService } from "../../app/Services/ForeignDirectoryExportService";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("an administrator can export the foreign directory", async () => {
  const { service } = await boot();

  const pdf = text(await service.exportDirectory(administrator()));

  expect(pdf.startsWith("%PDF")).toBe(true);
  expect(pdf).toContain("Mission: Embassy of Senegal");
  expect(pdf).toContain("Country: Senegal");
  expect(pdf).toContain("Staff: Aminata Diop");
  expect(pdf).toContain("Passport: SN1");
  expect(pdf).toContain("Dependent: Fatou Diop");
  expect(pdf).toContain("spouse");
  expect(pdf).toContain("Mission: High Commission of Nigeria");
  expect(pdf).toContain("Staff: Chidi Okonkwo");
  expect(pdf).toContain("Dependent: Ada Okonkwo");
  expect(pdf).toContain("child");
});

test("a non-administrator cannot export the foreign directory", async () => {
  const { connection } = await boot();
  let rendered = 0;
  const service = new ForeignDirectoryExportService(connection, {
    render() {
      rendered += 1;
      return new Uint8Array();
    },
  });
  const actors: Actor[] = [
    {
      role: RoleSlug.HonorableMinister,
      personnelId: null,
      missionId: null,
    },
    {
      role: RoleSlug.PermanentSecretary,
      personnelId: null,
      missionId: null,
    },
    {
      role: RoleSlug.ForeignServiceOfficer,
      personnelId: 1,
      missionId: null,
    },
    {
      role: RoleSlug.MissionPostUser,
      personnelId: null,
      missionId: 1,
    },
  ];

  for (const actor of actors) {
    await expect(service.exportDirectory(actor)).rejects.toBeInstanceOf(HttpException);
  }

  expect(rendered).toBe(0);
});

test("country and mission name filters narrow the directory", async () => {
  const { service } = await boot();

  const byCountry = text(await service.exportDirectory(administrator(), { country: "NIGERIA" }));
  expect(byCountry).toContain("Chidi Okonkwo");
  expect(byCountry).toContain("Ada Okonkwo");
  expect(byCountry).not.toContain("Aminata Diop");
  expect(byCountry).not.toContain("Fatou Diop");

  const byName = text(
    await service.exportDirectory(administrator(), { missionName: "embassy of senegal" }),
  );
  expect(byName).toContain("Aminata Diop");
  expect(byName).toContain("Fatou Diop");
  expect(byName).not.toContain("Chidi Okonkwo");

  const neither = text(
    await service.exportDirectory(administrator(), {
      country: "Senegal",
      missionName: "Nigeria",
    }),
  );
  expect(neither.startsWith("%PDF")).toBe(true);
  expect(neither).not.toContain("Aminata Diop");
  expect(neither).not.toContain("Chidi Okonkwo");
});

test("an unfiltered export includes every foreign mission, staff member, and dependent", async () => {
  const { service } = await boot();
  const seen: ForeignDirectoryDocument[] = [];
  const recording = new ForeignDirectoryExportService(database!.connection(), {
    render(document) {
      seen.push(document);
      return new TextEncoder().encode("%PDF");
    },
  });

  await recording.exportDirectory(administrator(), {});

  expect(seen[0]?.missions.map((mission) => mission.name)).toEqual([
    "Embassy of Senegal",
    "High Commission of Nigeria",
  ]);
  expect(seen[0]?.missions[0]?.staff.map((member) => member.fullName)).toEqual(["Aminata Diop"]);
  expect(seen[0]?.missions[0]?.staff[0]?.dependents).toEqual([
    { fullName: "Fatou Diop", relationship: "spouse" },
  ]);
  expect(seen[0]?.missions[1]?.staff[0]?.dependents).toEqual([
    { fullName: "Ada Okonkwo", relationship: "child" },
  ]);
});

test("export does not write a registry row, a stored pdf, or an audit row", async () => {
  const { service, connection } = await boot();
  const before = await counts(connection);

  const pdf = await service.exportDirectory(administrator());

  expect(text(pdf).startsWith("%PDF")).toBe(true);
  expect(text(pdf)).not.toContain("Ama Jallow");
  expect(text(pdf)).not.toContain("photographs/");
  expect(text(pdf)).not.toContain("secret.jpg");
  expect(await counts(connection)).toEqual(before);
});

test("a failed render writes nothing", async () => {
  const { connection } = await boot();
  const before = await counts(connection);
  const service = new ForeignDirectoryExportService(connection, {
    render() {
      throw new Error("pdf failed");
    },
  });

  await expect(service.exportDirectory(administrator())).rejects.toThrow("pdf failed");
  expect(await counts(connection)).toEqual(before);
});

function administrator(): Actor {
  return {
    role: RoleSlug.Administrator,
    personnelId: null,
    missionId: null,
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

  await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values ('Ama Jallow', '1980-01-02', 'P900', 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
  );

  const senegal = await insertMission(connection, {
    name: "Embassy of Senegal",
    country: "Senegal",
    address: "Pipeline Road",
    email: "senegal@example.test",
    phone: "4390001",
  });
  const nigeria = await insertMission(connection, {
    name: "High Commission of Nigeria",
    country: "Nigeria",
    address: "Kairaba Avenue",
    email: "nigeria@example.test",
    phone: "4390002",
  });
  const aminata = await insertStaff(connection, senegal, "Aminata Diop", "SN1", "secret.jpg");
  const chidi = await insertStaff(connection, nigeria, "Chidi Okonkwo", "NG1", null);
  await insertDependent(connection, aminata, "Fatou Diop", "spouse");
  await insertDependent(connection, chidi, "Ada Okonkwo", "child");

  return {
    connection,
    service: new ForeignDirectoryExportService(connection),
  };
}

async function insertMission(
  connection: Connection,
  mission: { name: string; country: string; address: string; email: string; phone: string },
): Promise<number> {
  const inserted = await connection.execute(
    `insert into foreign_diplomatic_missions (name, country, address, email, phone, created_at, updated_at)
     values (?, ?, ?, ?, ?, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [mission.name, mission.country, mission.address, mission.email, mission.phone],
  );
  return Number(inserted.lastInsertId);
}

async function insertStaff(
  connection: Connection,
  missionId: number,
  fullName: string,
  passport: string,
  photograph: string | null,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into foreign_diplomatic_staff (
       foreign_diplomatic_mission_id, full_name, nationality, passport_number, photograph_path,
       designation, country_represented, accreditation_starts_on, created_at, updated_at
     ) values (?, ?, 'West African', ?, ?, 'Counsellor', 'Country', '2024-01-01', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [missionId, fullName, passport, photograph],
  );
  return Number(inserted.lastInsertId);
}

async function insertDependent(
  connection: Connection,
  staffId: number,
  fullName: string,
  relationship: "spouse" | "child",
): Promise<void> {
  await connection.execute(
    `insert into foreign_diplomatic_dependents (foreign_diplomatic_staff_id, full_name, relationship, created_at, updated_at)
     values (?, ?, ?, '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [staffId, fullName, relationship],
  );
}

async function counts(connection: Connection): Promise<Record<string, number>> {
  const tables = [
    "foreign_diplomatic_missions",
    "foreign_diplomatic_staff",
    "foreign_diplomatic_dependents",
    "personnel",
    "audit_logs",
    "correspondence",
  ];
  const result: Record<string, number> = {};
  for (const table of tables) {
    result[table] = (await connection.table(table).get()).length;
  }
  return result;
}

function text(pdf: Uint8Array): string {
  return new TextDecoder().decode(pdf);
}
