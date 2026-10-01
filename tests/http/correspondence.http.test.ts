import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { Correspondence } from "../../app/Models/Correspondence";
import { Personnel } from "../../app/Models/Personnel";
import { Posting } from "../../app/Models/Posting";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-correspondence-${crypto.randomUUID()}`);
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

test("a guest who opens correspondence pages is redirected to /login", async () => {
  const index = await get("/correspondence");
  const create = await get("/correspondence/create");
  const pdf = await get("/correspondence/1/pdf");

  expect(index.status).toBe(302);
  expect(create.status).toBe(302);
  expect(pdf.status).toBe(302);
  expect(index.headers.get("location")).toContain("/login");
  expect(create.headers.get("location")).toContain("/login");
  expect(pdf.headers.get("location")).toContain("/login");
});

test("a Mission/Post User sees correspondence involving their mission", async () => {
  const dakar = await createMission("Dakar");
  const london = await createMission("London");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const session = await login(user.email);
  const body = `Dakar letter ${crypto.randomUUID()}`;
  await compose(session, london, body);

  const page = await get("/correspondence", session);
  const html = await page.text();

  expect(page.status).toBe(200);
  expect(html).toContain("Correspondence\\/Index");
  expect(html).toContain(body);
  expect(html).toContain(`"from_mission_id":${dakar}`);
});

test("a Foreign Service Officer sees correspondence involving their current mission", async () => {
  const home = await createMission("Officer Home");
  const dakar = await createMission("Officer Dakar");
  const personnel = await createPersonnel("Posted Correspondent");
  await openPosting(personnel.id, home);
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);
  const body = `Officer letter ${crypto.randomUUID()}`;
  await compose(session, dakar, body);

  const page = await get("/correspondence", session);
  const html = await page.text();

  expect(page.status).toBe(200);
  expect(html).toContain(body);
  expect(html).toContain(`"from_mission_id":${home}`);
});

test("Home sees only correspondence involving Home", async () => {
  const home = await createMission("Home", true);
  const dakar = await createMission("Away Dakar");
  const london = await createMission("Away London");
  const personnel = await createPersonnel("Home Officer");
  await openPosting(personnel.id, home);
  const homeOfficer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const dakarUser = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const homeSession = await login(homeOfficer.email);
  const dakarSession = await login(dakarUser.email);
  const elsewhere = `Elsewhere ${crypto.randomUUID()}`;
  const toHome = `To Home ${crypto.randomUUID()}`;
  await compose(dakarSession, london, elsewhere);
  await compose(dakarSession, home, toHome);

  const page = await get("/correspondence", homeSession);
  const html = await page.text();

  expect(page.status).toBe(200);
  expect(html).toContain(toHome);
  expect(html.includes(elsewhere)).toBe(false);
});

test("an actor cannot view correspondence belonging to unrelated missions", async () => {
  const dakar = await createMission("Private Dakar");
  const home = await createMission("Private Home");
  const london = await createMission("Private London");
  const sender = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const outsider = await createUser(RoleSlug.MissionPostUser, null, london);
  const body = `Private letter ${crypto.randomUUID()}`;
  await compose(await login(sender.email), home, body);

  const page = await get("/correspondence", await login(outsider.email));
  const html = await page.text();

  expect(page.status).toBe(200);
  expect(html.includes(body)).toBe(false);
});

test("a Mission/Post User can compose", async () => {
  const dakar = await createMission("Compose Dakar");
  const london = await createMission("Compose London");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const session = await login(user.email);
  const body = `Composed ${crypto.randomUUID()}`;

  const form = await get("/correspondence/create", session);
  const submitted = await compose(session, london, body);

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("Correspondence\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain("/correspondence");
  const row = await Correspondence.query().where("body", body).first();
  expect(Number(row?.getAttribute("from_mission_id"))).toBe(dakar);
  expect(Number(row?.getAttribute("to_mission_id"))).toBe(london);
});

test("a Foreign Service Officer can compose from their current posting", async () => {
  const home = await createMission("Current Home");
  const dakar = await createMission("Current Dakar");
  const personnel = await createPersonnel("Current Officer");
  await openPosting(personnel.id, home);
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const body = `From posting ${crypto.randomUUID()}`;

  const submitted = await compose(await login(officer.email), dakar, body);

  expect(submitted.status).toBe(303);
  const row = await Correspondence.query().where("body", body).first();
  expect(Number(row?.getAttribute("from_mission_id"))).toBe(home);
});

test("a submitted fromMissionId does not change the sender", async () => {
  const dakar = await createMission("Spoof Dakar");
  const london = await createMission("Spoof London");
  const home = await createMission("Spoof Home");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const body = `Spoofed ${crypto.randomUUID()}`;

  const submitted = await post(
    "/correspondence",
    {
      from_mission_id: String(london),
      to_mission_id: String(home),
      body,
      composed_on: "2026-10-01",
    },
    await login(user.email),
  );

  expect(submitted.status).toBe(303);
  const row = await Correspondence.query().where("body", body).first();
  expect(Number(row?.getAttribute("from_mission_id"))).toBe(dakar);
  expect(Number(row?.getAttribute("to_mission_id"))).toBe(home);
});

test("the recipient mission must exist", async () => {
  const dakar = await createMission("Missing Recipient");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);

  const response = await compose(await login(user.email), 999999, "Missing recipient");

  expect(response.status).toBe(422);
  expect(await Correspondence.query().where("from_mission_id", dakar).get()).toHaveLength(0);
});

test("the sender and recipient cannot be the same mission", async () => {
  const dakar = await createMission("Same Mission");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);

  const response = await compose(await login(user.email), dakar, "To myself");

  expect(response.status).toBe(422);
  expect(await Correspondence.query().where("from_mission_id", dakar).get()).toHaveLength(0);
});

test("Administrator, Honorable Minister, and Permanent Secretary cannot compose", async () => {
  const london = await createMission("Closed London");
  const roles = [
    RoleSlug.Administrator,
    RoleSlug.HonorableMinister,
    RoleSlug.PermanentSecretary,
  ];

  for (const role of roles) {
    const user = await createUser(role, null, null);
    const session = await login(user.email);
    const index = await get("/correspondence", session);
    const form = await get("/correspondence/create", session);
    const submitted = await compose(session, london, `Denied ${role}`);

    expect(index.status).toBe(403);
    expect(form.status).toBe(403);
    expect(submitted.status).toBe(403);
  }

  expect(await Correspondence.query().where("to_mission_id", london).get()).toHaveLength(0);
});

test("successful composition returns the correspondence index", async () => {
  const dakar = await createMission("Redirect Dakar");
  const london = await createMission("Redirect London");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const session = await login(user.email);
  const body = `Redirected ${crypto.randomUUID()}`;

  const submitted = await compose(session, london, body);
  const page = await get("/correspondence", session);
  const html = await page.text();

  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain("/correspondence");
  expect(page.status).toBe(200);
  expect(html).toContain("Correspondence\\/Index");
  expect(html).toContain(body);
});

test("the PDF endpoint returns the stored private PDF", async () => {
  const dakar = await createMission("Pdf Dakar");
  const london = await createMission("Pdf London");
  const user = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const body = `Stored pdf ${crypto.randomUUID()}`;
  await compose(await login(user.email), london, body);
  const row = await Correspondence.query().where("body", body).first();
  const id = Number(row?.getAttribute("id"));
  const pdfPath = String(row?.getAttribute("pdf_path"));
  const stored = await Bun.file(join(process.cwd(), "storage/app/private", pdfPath)).bytes();

  const response = await get(`/correspondence/${id}/pdf`, await login(user.email));
  const downloaded = new Uint8Array(await response.arrayBuffer());

  expect(response.status).toBe(200);
  expect(downloaded).toEqual(stored);
  expect(new TextDecoder().decode(downloaded).startsWith("%PDF")).toBe(true);
});

test("unauthorized PDF access returns 403", async () => {
  const dakar = await createMission("Hidden Dakar");
  const home = await createMission("Hidden Home");
  const london = await createMission("Hidden London");
  const sender = await createUser(RoleSlug.MissionPostUser, null, dakar);
  const outsider = await createUser(RoleSlug.MissionPostUser, null, london);
  const body = `Hidden pdf ${crypto.randomUUID()}`;
  await compose(await login(sender.email), home, body);
  const row = await Correspondence.query().where("body", body).first();

  const response = await get(
    `/correspondence/${Number(row?.getAttribute("id"))}/pdf`,
    await login(outsider.email),
  );

  expect(response.status).toBe(403);
});

async function compose(
  session: Session,
  toMissionId: number,
  body: string,
): Promise<Response> {
  return post(
    "/correspondence",
    {
      to_mission_id: String(toMissionId),
      body,
      composed_on: "2026-10-01",
    },
    session,
  );
}

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

async function createMission(name: string, isHome = false): Promise<number> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const inserted = await User.getConnection().execute(
    `insert into missions (name, is_home, created_at, updated_at) values (?, ?, ?, ?)`,
    [`${name} ${crypto.randomUUID().slice(0, 8)}`, isHome ? 1 : 0, now, now],
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
