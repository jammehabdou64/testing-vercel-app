import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { Personnel } from "../../app/Models/Personnel";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { VacationNotification } from "../../app/Models/VacationNotification";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-vacation-${crypto.randomUUID()}`);
mkdirSync(join(root, "sessions"), { recursive: true });
process.env.DB_CONNECTION = "sqlite";
process.env.DB_DATABASE = join(root, "test.sqlite");
process.env.SESSION_DRIVER = "file";
process.env.SESSION_FILES = join(root, "sessions");

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");
const password = "password1";

type Session = { cookie: string; token: string };

let application: { handle(request: AppRequest): Promise<Response>; boot(): Promise<unknown> };

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

test("a guest who opens vacation pages is redirected to /login", async () => {
  const index = await get("/vacation-notifications");
  const create = await get("/vacation-notifications/create");
  const show = await get("/vacation-notifications/1");

  expect(index.status).toBe(302);
  expect(create.status).toBe(302);
  expect(show.status).toBe(302);
  expect(index.headers.get("location")).toContain("/login");
  expect(create.headers.get("location")).toContain("/login");
  expect(show.headers.get("location")).toContain("/login");
});

test("a Foreign Service Officer can file a vacation notification for their own record", async () => {
  const personnel = await createPersonnel("Filing Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);
  const reason = `Family visit ${crypto.randomUUID()}`;

  const form = await get("/vacation-notifications/create", session);
  const submitted = await file(session, "Senegal", reason);
  const page = await get("/vacation-notifications", session);
  const html = await page.text();
  const row = await VacationNotification.query().where("reason", reason).first();

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("Vacation\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain("/vacation-notifications");
  expect(Number(row?.getAttribute("personnel_id"))).toBe(personnel.id);
  expect(row?.getAttribute("travelling_country")).toBe("Senegal");
  expect(String(row?.getAttribute("submitted_on")).slice(0, 10)).toBe("2026-10-01");
  expect(row?.getAttribute("full_name")).toBeUndefined();
  expect(row?.getAttribute("designation")).toBeUndefined();
  expect(page.status).toBe(200);
  expect(html).toContain("Vacation\\/Index");
  expect(html).toContain(reason);
  expect(html).toContain("Senegal");
});

test("a submitted personnel id does not change the officer", async () => {
  const own = await createPersonnel("Real Officer");
  const other = await createPersonnel("Other Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, own.id, null);
  const reason = `Spoofed notice ${crypto.randomUUID()}`;

  const submitted = await post(
    "/vacation-notifications",
    {
      personnel_id: String(other.id),
      travelling_country: "France",
      reason,
      submitted_on: "2026-10-02",
    },
    await login(officer.email),
  );

  expect(submitted.status).toBe(303);
  const row = await VacationNotification.query().where("reason", reason).first();
  expect(Number(row?.getAttribute("personnel_id"))).toBe(own.id);
  expect(await VacationNotification.query().where("personnel_id", other.id).get()).toHaveLength(0);
});

test("country, reason, and submission date are required", async () => {
  const personnel = await createPersonnel("Invalid Notice");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const missingCountry = await post(
    "/vacation-notifications",
    { reason: "Visit", submitted_on: "2026-10-01" },
    session,
  );
  const missingReason = await post(
    "/vacation-notifications",
    { travelling_country: "Ghana", submitted_on: "2026-10-01" },
    session,
  );
  const missingDate = await post(
    "/vacation-notifications",
    { travelling_country: "Ghana", reason: "Visit" },
    session,
  );
  const blankCountry = await file(session, "   ", "Blank country");

  expect(missingCountry.status).toBe(422);
  expect(missingReason.status).toBe(422);
  expect(missingDate.status).toBe(422);
  expect(blankCountry.status).toBe(422);
  expect(await VacationNotification.query().where("personnel_id", personnel.id).get()).toHaveLength(
    0,
  );
});

test("Administrator, Honorable Minister, Permanent Secretary, and Mission/Post User cannot file", async () => {
  const missionId = await createMission();
  const roles = [
    { role: RoleSlug.Administrator, personnelId: null, missionId: null },
    { role: RoleSlug.HonorableMinister, personnelId: null, missionId: null },
    { role: RoleSlug.PermanentSecretary, personnelId: null, missionId: null },
    { role: RoleSlug.MissionPostUser, personnelId: null, missionId },
  ];

  const before = (await VacationNotification.query().get()).length;

  for (const entry of roles) {
    const session = await login(
      (await createUser(entry.role, entry.personnelId, entry.missionId)).email,
    );
    const index = await get("/vacation-notifications", session);
    const form = await get("/vacation-notifications/create", session);
    const submitted = await file(session, "Senegal", `Denied ${entry.role}`);

    expect(index.status).toBe(entry.role === RoleSlug.Administrator ? 200 : 403);
    expect(form.status).toBe(403);
    expect(submitted.status).toBe(403);
  }

  expect((await VacationNotification.query().get()).length).toBe(before);
});

test("another Foreign Service Officer cannot view the notice", async () => {
  const owner = await createPersonnel("Notice Owner");
  const other = await createPersonnel("Notice Other");
  const ownerUser = await createUser(RoleSlug.ForeignServiceOfficer, owner.id, null);
  const otherUser = await createUser(RoleSlug.ForeignServiceOfficer, other.id, null);
  const reason = `Private notice ${crypto.randomUUID()}`;
  await file(await login(ownerUser.email), "Senegal", reason);
  const row = await VacationNotification.query().where("reason", reason).first();
  const session = await login(otherUser.email);

  const index = await get("/vacation-notifications", session);
  const show = await get(`/vacation-notifications/${Number(row?.id)}`, session);
  const html = await index.text();

  expect(index.status).toBe(200);
  expect(html.includes(reason)).toBe(false);
  expect(show.status).toBe(403);
});

test("an Administrator can view a filed notice", async () => {
  const personnel = await createPersonnel("Visible Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const reason = `Admin visible ${crypto.randomUUID()}`;
  await file(await login(officer.email), "Nigeria", reason);
  const row = await VacationNotification.query().where("reason", reason).first();
  const session = await login(admin.email);

  const index = await get("/vacation-notifications", session);
  const show = await get(`/vacation-notifications/${Number(row?.id)}`, session);
  const indexHtml = await index.text();
  const showHtml = await show.text();

  expect(index.status).toBe(200);
  expect(indexHtml).toContain(reason);
  expect(show.status).toBe(200);
  expect(showHtml).toContain("Vacation\\/Show");
  expect(showHtml).toContain(reason);
  expect(showHtml).toContain("Nigeria");
});

async function file(session: Session, country: string, reason: string): Promise<Response> {
  return post(
    "/vacation-notifications",
    {
      travelling_country: country,
      reason,
      submitted_on: "2026-10-01",
    },
    session,
  );
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

async function createMission(): Promise<number> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const inserted = await User.getConnection().execute(
    `insert into missions (name, is_home, created_at, updated_at) values (?, 0, ?, ?)`,
    [`Mission ${crypto.randomUUID().slice(0, 8)}`, now, now],
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
  const active = session ?? (await openSession());
  const body = new URLSearchParams({ ...fields, _token: active.token });
  return application.handle(
    new AppRequest(
      new Request(`http://localhost${path}`, {
        method: "POST",
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

async function login(email: string): Promise<Session> {
  const guest = await openSession();
  const response = await post("/login", { email, password }, guest);
  if (response.status !== 303 && response.status !== 302) {
    throw new Error(`Login failed with ${response.status}: ${await response.text()}`);
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
  const cookie = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  return { cookie, token };
}
