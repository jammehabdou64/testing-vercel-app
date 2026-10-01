import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { Mission } from "../../app/Models/Mission";
import { Personnel } from "../../app/Models/Personnel";
import { Posting } from "../../app/Models/Posting";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-missions-${crypto.randomUUID()}`);
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

test("a guest who opens mission pages is redirected to /login", async () => {
  const index = await get("/missions");
  const create = await get("/missions/create");
  const edit = await get("/missions/1/edit");

  expect(index.status).toBe(302);
  expect(create.status).toBe(302);
  expect(edit.status).toBe(302);
  expect(index.headers.get("location")).toContain("/login");
  expect(create.headers.get("location")).toContain("/login");
});

test("an administrator can create a mission and see it in the list", async () => {
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);
  const name = `Embassy ${crypto.randomUUID().slice(0, 8)}`;

  const form = await get("/missions/create", session);
  const submitted = await post("/missions", { name }, session);
  const created = await Mission.query().where("name", name).first();
  const page = await get("/missions", session);
  const html = await page.text();

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("Missions\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain(`/missions/${created?.id}/edit`);
  expect(Number(created?.getAttribute("is_home"))).toBe(0);
  expect(page.status).toBe(200);
  expect(html).toContain("Missions\\/Index");
  expect(html).toContain(name);
});

test("an administrator can update a mission that a posting still references", async () => {
  const name = `Posted ${crypto.randomUUID().slice(0, 8)}`;
  const renamed = `Renamed ${crypto.randomUUID().slice(0, 8)}`;
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);
  await post("/missions", { name }, session);
  const mission = await Mission.query().where("name", name).first();
  const missionId = Number(mission?.id);
  const personnel = await createPersonnel("Mission Officer");
  await openPosting(personnel.id, missionId);

  const edit = await get(`/missions/${missionId}/edit`, session);
  const updated = await send(
    "PUT",
    `/missions/${missionId}`,
    { name: renamed, is_home: "1" },
    session,
  );

  expect(edit.status).toBe(200);
  expect(await edit.text()).toContain("Missions\\/Edit");
  expect(updated.status).toBe(303);
  const stored = await Mission.find(missionId);
  expect(stored?.getAttribute("name")).toBe(renamed);
  expect(Number(stored?.getAttribute("is_home"))).toBe(1);
  const posting = await Posting.query().where("mission_id", missionId).first();
  expect(Number(posting?.getAttribute("mission_id"))).toBe(missionId);
});

test("a mission name is required", async () => {
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);
  const before = (await Mission.query().get()).length;

  const response = await post("/missions", { is_home: "0" }, session);

  expect(response.status).toBe(422);
  expect((await Mission.query().get()).length).toBe(before);
});

test("only an administrator can manage missions", async () => {
  const missionId = await createMission("Closed Mission");
  const personnel = await createPersonnel("Denied Mission User");
  const roles = [
    { role: RoleSlug.ForeignServiceOfficer, personnelId: personnel.id, missionId: null },
    { role: RoleSlug.HonorableMinister, personnelId: null, missionId: null },
    { role: RoleSlug.PermanentSecretary, personnelId: null, missionId: null },
    { role: RoleSlug.MissionPostUser, personnelId: null, missionId },
  ];

  for (const entry of roles) {
    const session = await login(
      (await createUser(entry.role, entry.personnelId, entry.missionId)).email,
    );
    const index = await get("/missions", session);
    const form = await get("/missions/create", session);
    const submitted = await post("/missions", { name: `Denied ${entry.role}` }, session);
    const edit = await get(`/missions/${missionId}/edit`, session);

    expect(index.status).toBe(403);
    expect(form.status).toBe(403);
    expect(submitted.status).toBe(403);
    expect(edit.status).toBe(403);
  }

  expect(
    (await Mission.query().get()).filter((mission) =>
      String(mission.getAttribute("name")).startsWith("Denied "),
    ),
  ).toHaveLength(0);
});

test("there is no mission delete route", async () => {
  const missionId = await createMission("Kept Mission");
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);

  const response = await send("DELETE", `/missions/${missionId}`, {}, session);

  expect(response.status).toBe(404);
  expect(await Mission.find(missionId)).not.toBeNull();
});

async function openPosting(personnelId: number, missionId: number): Promise<void> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  await Posting.create({
    personnel_id: personnelId,
    mission_id: missionId,
    starts_on: "2024-01-01",
    ends_on: null,
    created_at: now,
    updated_at: now,
  });
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

async function createMission(name: string): Promise<number> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const inserted = await User.getConnection().execute(
    `insert into missions (name, is_home, created_at, updated_at) values (?, 0, ?, ?)`,
    [name, now, now],
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
