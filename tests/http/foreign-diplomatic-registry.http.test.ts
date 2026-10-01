import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { ForeignDiplomaticDependent } from "../../app/Models/ForeignDiplomaticDependent";
import { ForeignDiplomaticMission } from "../../app/Models/ForeignDiplomaticMission";
import { ForeignDiplomaticStaff } from "../../app/Models/ForeignDiplomaticStaff";
import { Personnel } from "../../app/Models/Personnel";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-foreign-${crypto.randomUUID()}`);
mkdirSync(join(root, "sessions"), { recursive: true });
process.env.DB_CONNECTION = "sqlite";
process.env.DB_DATABASE = join(root, "test.sqlite");
process.env.SESSION_DRIVER = "file";
process.env.SESSION_FILES = join(root, "sessions");

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");
const password = "password1";

type Session = { cookie: string; token: string };

let application: {
  handle(request: AppRequest): Promise<Response>;
  boot(): Promise<unknown>;
};

beforeAll(async () => {
  const loaded = await import("../../bootstrap/app");
  application = loaded.app;
  await application.boot();
  const connection = User.getConnection();
  await new Migrator(connection, migrationsDirectory).run();
  await connection.execute("pragma foreign_keys = on");
  await new RoleSeeder().run();
});

afterAll(async () => {
  await User.getConnection().disconnect();
});

test("a guest who opens the foreign registry is redirected to /login", async () => {
  const index = await get("/foreign-missions");
  const create = await get("/foreign-missions/create");
  const exported = await get("/foreign-missions/export");

  expect(index.status).toBe(302);
  expect(create.status).toBe(302);
  expect(exported.status).toBe(302);
  expect(index.headers.get("location")).toContain("/login");
  expect(exported.headers.get("location")).toContain("/login");
});

test("only an administrator can manage foreign diplomatic missions", async () => {
  const personnel = await createPersonnel("Registry Officer");
  const missionId = await createGambianMission();
  const roles = [
    {
      role: RoleSlug.ForeignServiceOfficer,
      personnelId: personnel.id,
      missionId: null,
    },
    { role: RoleSlug.HonorableMinister, personnelId: null, missionId: null },
    { role: RoleSlug.PermanentSecretary, personnelId: null, missionId: null },
    { role: RoleSlug.MissionPostUser, personnelId: null, missionId },
  ];

  for (const entry of roles) {
    const session = await login(
      (await createUser(entry.role, entry.personnelId, entry.missionId)).email,
    );
    const index = await get("/foreign-missions", session);
    const form = await get("/foreign-missions/create", session);
    const submitted = await post(
      "/foreign-missions",
      missionFields("Denied Mission"),
      session,
    );

    expect(index.status).toBe(403);
    expect(form.status).toBe(403);
    expect(submitted.status).toBe(403);
  }
});

test("an administrator can create and update a foreign diplomatic mission", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const name = unique("Embassy of Senegal");

  const form = await get("/foreign-missions/create", session);
  const submitted = await post(
    "/foreign-missions",
    missionFields(name),
    session,
  );
  const created = await ForeignDiplomaticMission.query()
    .where("name", name)
    .first();
  const missionId = Number(created?.id);
  const renamed = unique("Embassy of Senegal Updated");
  const edit = await get(`/foreign-missions/${missionId}/edit`, session);
  const updated = await send(
    "PUT",
    `/foreign-missions/${missionId}`,
    { ...missionFields(renamed), country: "Senegal" },
    session,
  );
  const page = await get("/foreign-missions", session);
  const html = await page.text();

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("ForeignMissions\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain(
    `/foreign-missions/${missionId}/edit`,
  );
  expect(edit.status).toBe(200);
  expect(await edit.text()).toContain("ForeignMissions\\/Edit");
  expect(updated.status).toBe(303);
  expect(
    (await ForeignDiplomaticMission.find(missionId))?.getAttribute("name"),
  ).toBe(renamed);
  expect(page.status).toBe(200);
  expect(html).toContain("ForeignMissions\\/Index");
  expect(html).toContain(renamed);
});

test("an administrator can create, view, and update diplomatic staff without a personnel or user row", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const missionId = await foreignMission(
    session,
    unique("Staff Mission"),
    "Ghana",
  );
  const otherId = await foreignMission(
    session,
    unique("Other Mission"),
    "Ghana",
  );
  const usersBefore = (await User.query().get()).length;
  const personnelBefore = (await Personnel.query().get()).length;
  const name = unique("Amadou Diallo");

  const form = await get(
    `/foreign-missions/${missionId}/staff/create`,
    session,
  );
  const submitted = await post(
    `/foreign-missions/${missionId}/staff`,
    {
      ...staffFields(name),
      foreign_diplomatic_mission_id: String(otherId),
      personnel_id: "1",
    },
    session,
  );
  const member = await ForeignDiplomaticStaff.query()
    .where("full_name", name)
    .first();
  const staffId = Number(member?.id);
  const show = await get(
    `/foreign-missions/${missionId}/staff/${staffId}`,
    session,
  );
  const showHtml = await show.text();
  const wrongMission = await get(
    `/foreign-missions/${otherId}/staff/${staffId}`,
    session,
  );
  const renamed = unique("Amadou Diallo Updated");
  const updated = await send(
    "PUT",
    `/foreign-missions/${missionId}/staff/${staffId}`,
    staffFields(renamed),
    session,
  );

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("ForeignStaff\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain(
    `/foreign-missions/${missionId}/staff/${staffId}`,
  );
  expect(Number(member?.getAttribute("foreign_diplomatic_mission_id"))).toBe(
    missionId,
  );
  expect(member?.getAttribute("personnel_id")).toBeUndefined();
  expect(member?.getAttribute("user_id")).toBeUndefined();
  expect((await User.query().get()).length).toBe(usersBefore);
  expect((await Personnel.query().get()).length).toBe(personnelBefore);
  expect(show.status).toBe(200);
  expect(showHtml).toContain("ForeignStaff\\/Show");
  expect(showHtml).toContain(name);
  expect(wrongMission.status).toBe(404);
  expect(updated.status).toBe(303);
  expect(
    (await ForeignDiplomaticStaff.find(staffId))?.getAttribute("full_name"),
  ).toBe(renamed);
});

test("an administrator can add, update, and delete a diplomatic dependent", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const missionId = await foreignMission(
    session,
    unique("Dependent Mission"),
    "Mali",
  );
  const staffId = await diplomaticStaff(
    session,
    missionId,
    unique("Staff Parent"),
  );
  const otherStaffId = await diplomaticStaff(
    session,
    missionId,
    unique("Other Parent"),
  );
  const name = unique("Awa Diallo");

  const created = await post(
    `/foreign-missions/${missionId}/staff/${staffId}/dependents`,
    { full_name: name, relationship: "spouse" },
    session,
  );
  const dependent = await ForeignDiplomaticDependent.query()
    .where("full_name", name)
    .first();
  const dependentId = Number(dependent?.id);
  const renamed = unique("Awa Diallo Updated");
  const updated = await send(
    "PUT",
    `/foreign-missions/${missionId}/staff/${staffId}/dependents/${dependentId}`,
    { full_name: renamed, relationship: "child" },
    session,
  );
  const stored = await ForeignDiplomaticDependent.find(dependentId);
  const wrongStaff = await send(
    "PUT",
    `/foreign-missions/${missionId}/staff/${otherStaffId}/dependents/${dependentId}`,
    { full_name: "Should Not Save", relationship: "spouse" },
    session,
  );
  const afterWrongStaff = await ForeignDiplomaticDependent.find(dependentId);
  const removed = await send(
    "DELETE",
    `/foreign-missions/${missionId}/staff/${staffId}/dependents/${dependentId}`,
    {},
    session,
  );

  expect(created.status).toBe(303);
  expect(Number(dependent?.getAttribute("foreign_diplomatic_staff_id"))).toBe(
    staffId,
  );
  expect(updated.status).toBe(303);
  expect(stored?.getAttribute("relationship")).toBe("child");
  expect(stored?.getAttribute("full_name")).toBe(renamed);
  expect(wrongStaff.status).toBe(404);
  expect(afterWrongStaff?.getAttribute("full_name")).toBe(renamed);
  expect(removed.status).toBe(303);
  expect(await ForeignDiplomaticDependent.find(dependentId)).toBeNull();
});

test("an administrator can replace a diplomatic staff photograph", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const missionId = await foreignMission(
    session,
    unique("Photo Mission"),
    "Guinea",
  );
  const staffId = await diplomaticStaff(
    session,
    missionId,
    unique("Photo Staff"),
  );

  const uploaded = await uploadPhotograph(
    missionId,
    staffId,
    session,
    jpeg(),
    "portrait.jpg",
    "image/jpeg",
  );
  const member = await ForeignDiplomaticStaff.find(staffId);
  const path = String(member?.getAttribute("photograph_path"));

  expect(uploaded.status).toBe(303);
  expect(path.startsWith(`photographs/diplomatic-staff/${staffId}/`)).toBe(
    true,
  );
  expect(path.endsWith(".jpg")).toBe(true);
});

test("a photograph with invalid bytes is rejected", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const missionId = await foreignMission(
    session,
    unique("Bad Photo Mission"),
    "Guinea",
  );
  const staffId = await diplomaticStaff(
    session,
    missionId,
    unique("Bad Photo Staff"),
  );
  const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

  const uploaded = await uploadPhotograph(
    missionId,
    staffId,
    session,
    gif,
    "portrait.jpg",
    "image/jpeg",
  );

  expect(uploaded.status).toBe(422);
  expect(
    (await ForeignDiplomaticStaff.find(staffId))?.getAttribute(
      "photograph_path",
    ),
  ).toBeNull();
});

test("a non-administrator cannot export the foreign directory", async () => {
  const personnel = await createPersonnel("Export Officer");
  const roles = [
    RoleSlug.ForeignServiceOfficer,
    RoleSlug.HonorableMinister,
    RoleSlug.PermanentSecretary,
    RoleSlug.MissionPostUser,
  ];

  for (const role of roles) {
    const user = await createUser(
      role,
      role === RoleSlug.ForeignServiceOfficer ? personnel.id : null,
      role === RoleSlug.MissionPostUser ? await createGambianMission() : null,
    );
    const response = await get(
      "/foreign-missions/export",
      await login(user.email),
    );
    expect(response.status).toBe(403);
  }
});

test("an administrator export is a PDF and does not change the registry", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const missionName = unique("Export Senegal");
  const missionId = await foreignMission(session, missionName, "Senegal");
  const staffName = unique("Export Staff");
  const staffId = await diplomaticStaff(session, missionId, staffName);
  await post(
    `/foreign-missions/${missionId}/staff/${staffId}/dependents`,
    { full_name: unique("Export Dependent"), relationship: "spouse" },
    session,
  );
  const auditsBefore = (await User.getConnection().table("audit_logs").get())
    .length;
  const lettersBefore = (
    await User.getConnection().table("correspondence").get()
  ).length;
  const missionsBefore = (await ForeignDiplomaticMission.query().get()).length;

  const response = await get("/foreign-missions/export", session);
  const pdf = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/pdf");
  expect(pdf.startsWith("%PDF")).toBe(true);
  expect(pdf).toContain(missionName);
  expect(pdf).toContain(staffName);
  expect(pdf.includes("photograph")).toBe(false);
  expect((await User.getConnection().table("audit_logs").get()).length).toBe(
    auditsBefore,
  );
  expect(
    (await User.getConnection().table("correspondence").get()).length,
  ).toBe(lettersBefore);
  expect((await ForeignDiplomaticMission.query().get()).length).toBe(
    missionsBefore,
  );
});

test("a country filter limits the exported directory", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const senegal = unique("Filter Senegal");
  const nigeria = unique("Filter Nigeria");
  await foreignMission(session, senegal, "Senegal");
  await foreignMission(session, nigeria, "Nigeria");

  const response = await get(
    "/foreign-missions/export?country=senegal",
    session,
  );
  const pdf = await response.text();

  expect(response.status).toBe(200);
  expect(pdf).toContain(senegal);
  expect(pdf.includes(nigeria)).toBe(false);
});

test("a mission-name filter limits the exported directory", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const dakar = unique("Dakar Commission");
  const abuja = unique("Abuja Commission");
  await foreignMission(session, dakar, "Senegal");
  await foreignMission(session, abuja, "Nigeria");

  const response = await get(
    "/foreign-missions/export?mission_name=abuja",
    session,
  );
  const pdf = await response.text();

  expect(response.status).toBe(200);
  expect(pdf).toContain(abuja);
  expect(pdf.includes(dakar)).toBe(false);
});

test("an unfiltered export includes the whole foreign directory", async () => {
  const session = await login(
    (await createUser(RoleSlug.Administrator, null, null)).email,
  );
  const first = unique("Whole Directory One");
  const second = unique("Whole Directory Two");
  await foreignMission(session, first, "Senegal");
  await foreignMission(session, second, "Nigeria");

  const response = await get("/foreign-missions/export", session);
  const pdf = await response.text();

  expect(response.status).toBe(200);
  expect(pdf.startsWith("%PDF")).toBe(true);
  expect(pdf).toContain(first);
  expect(pdf).toContain(second);
});

function unique(label: string): string {
  return `${label} ${crypto.randomUUID().slice(0, 8)}`;
}

function missionFields(name: string): Record<string, string> {
  return {
    name,
    country: "Senegal",
    address: "Pipeline Road, Banjul",
    email: "mission@example.test",
    phone: "+2200000000",
  };
}

function staffFields(fullName: string): Record<string, string> {
  return {
    full_name: fullName,
    nationality: "Senegalese",
    passport_number: `P${crypto.randomUUID().slice(0, 8)}`,
    designation: "Counsellor",
    country_represented: "Senegal",
    accreditation_starts_on: "2024-01-01",
    email: "staff@example.test",
    phone: "+2201111111",
  };
}

async function foreignMission(
  session: Session,
  name: string,
  country: string,
): Promise<number> {
  const response = await post(
    "/foreign-missions",
    { ...missionFields(name), country },
    session,
  );
  if (response.status !== 303) {
    throw new Error(
      `Mission create failed with ${response.status}: ${await response.text()}`,
    );
  }
  const mission = await ForeignDiplomaticMission.query()
    .where("name", name)
    .first();
  return Number(mission?.id);
}

async function diplomaticStaff(
  session: Session,
  missionId: number,
  name: string,
): Promise<number> {
  const response = await post(
    `/foreign-missions/${missionId}/staff`,
    staffFields(name),
    session,
  );
  if (response.status !== 303) {
    throw new Error(
      `Staff create failed with ${response.status}: ${await response.text()}`,
    );
  }
  const member = await ForeignDiplomaticStaff.query()
    .where("full_name", name)
    .first();
  return Number(member?.id);
}

async function createPersonnel(fullName: string): Promise<Personnel> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  return Personnel.create({
    full_name: fullName,
    date_of_birth: "1980-01-02",
    passport_number: `P${crypto.randomUUID().slice(0, 8)}`,
    designation: "Counsellor",
    email: null,
    phone: null,
    address: null,
    photograph_path: null,
    created_at: now,
    updated_at: now,
  });
}

async function createGambianMission(): Promise<number> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const inserted = await User.getConnection().execute(
    `insert into missions (name, is_home, created_at, updated_at) values (?, 0, ?, ?)`,
    [`Gambian ${crypto.randomUUID().slice(0, 8)}`, now, now],
  );
  return Number(inserted.lastInsertId);
}

async function createUser(
  role: RoleSlug,
  personnelId: number | null,
  missionId: number | null,
): Promise<User> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  return User.create({
    name: role,
    email: `${role}-${crypto.randomUUID()}@example.test`,
    password,
    role_id: await roleId(role),
    personnel_id: personnelId,
    mission_id: missionId,
    created_at: now,
    updated_at: now,
  });
}

async function roleId(slug: string): Promise<number> {
  const role = await Role.where("slug", slug).first();
  if (!role) {
    throw new Error(`Missing role ${slug}.`);
  }
  return Number(role.id);
}

function jpeg(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
}

async function get(path: string, session?: Session): Promise<Response> {
  return application.handle(
    new AppRequest(
      new Request(`http://localhost${path}`, {
        headers: session ? { cookie: session.cookie } : {},
      }),
    ),
  );
}

async function post(
  path: string,
  fields: Record<string, string>,
  session?: Session,
): Promise<Response> {
  return send("POST", path, fields, session);
}

async function send(
  method: string,
  path: string,
  fields: Record<string, string>,
  session?: Session,
): Promise<Response> {
  const active = session ?? (await openSession());
  const body = new URLSearchParams({ ...fields, _token: active.token });
  return application.handle(
    new AppRequest(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          cookie: active.cookie,
          "content-type": "application/x-www-form-urlencoded",
          "x-xsrf-token": active.token,
        },
        body,
      }),
    ),
  );
}

async function uploadPhotograph(
  missionId: number,
  staffId: number,
  session: Session,
  bytes: Uint8Array,
  filename: string,
  type: string,
): Promise<Response> {
  const form = new FormData();
  form.append("_token", session.token);
  form.append(
    "photograph",
    new File([Uint8Array.from(bytes)], filename, { type }),
  );
  return application.handle(
    new AppRequest(
      new Request(
        `http://localhost/foreign-missions/${missionId}/staff/${staffId}/photograph`,
        {
          method: "POST",
          headers: {
            cookie: session.cookie,
            "x-xsrf-token": session.token,
          },
          body: form,
        },
      ),
    ),
  );
}

async function login(email: string): Promise<Session> {
  const guest = await openSession();
  const response = await post("/login", { email, password }, guest);
  if (response.status !== 303 && response.status !== 302) {
    throw new Error(
      `Login failed with ${response.status}: ${await response.text()}`,
    );
  }
  return readSession(response, guest);
}

async function openSession(): Promise<Session> {
  return readSession(await get("/login"), { cookie: "", token: "" });
}

function readSession(response: Response, previous: Session): Session {
  const jar = new Map<string, string>();
  if (previous.cookie !== "") {
    for (const part of previous.cookie.split("; ")) {
      const eq = part.indexOf("=");
      if (eq > 0) {
        jar.set(part.slice(0, eq), part.slice(eq + 1));
      }
    }
  }
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(";")[0];
    if (!pair) {
      continue;
    }
    const eq = pair.indexOf("=");
    if (eq === -1) {
      continue;
    }
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  const token = decodeURIComponent(jar.get("XSRF-TOKEN") ?? previous.token);
  const cookie = [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return { cookie, token };
}
