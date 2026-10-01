import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { LeaveApplication } from "../../app/Models/LeaveApplication";
import { Personnel } from "../../app/Models/Personnel";
import { Posting } from "../../app/Models/Posting";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-posting-leave-${crypto.randomUUID()}`);
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

test("a guest who opens posting or leave pages is redirected to /login", async () => {
  const postings = await get("/personnel/1/postings");
  const leave = await get("/leave");
  const create = await get("/leave/create");

  expect(postings.status).toBe(302);
  expect(leave.status).toBe(302);
  expect(create.status).toBe(302);
  expect(postings.headers.get("location")).toContain("/login");
  expect(leave.headers.get("location")).toContain("/login");
});

test("an administrator can view postings and a Foreign Service Officer can view only their own", async () => {
  const own = await createPersonnel("Posted Officer");
  const other = await createPersonnel("Other Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, own.id, null);
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const minister = await createUser(RoleSlug.HonorableMinister, null, null);

  const ownPage = await get(`/personnel/${own.id}/postings`, await login(officer.email));
  const otherPage = await get(`/personnel/${other.id}/postings`, await login(officer.email));
  const adminPage = await get(`/personnel/${own.id}/postings`, await login(admin.email));
  const ministerPage = await get(`/personnel/${own.id}/postings`, await login(minister.email));

  expect(ownPage.status).toBe(200);
  expect(await ownPage.text()).toContain("Postings\\/Index");
  expect(otherPage.status).toBe(403);
  expect(adminPage.status).toBe(200);
  expect(ministerPage.status).toBe(403);
});

test("an administrator assignment closes the previous posting", async () => {
  const personnel = await createPersonnel("Reassigned Officer");
  const home = await createMission("Home Post");
  const dakar = await createMission("Dakar Post");
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);

  const first = await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: String(home), starts_on: "2020-01-01" },
    session,
  );
  const second = await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: String(dakar), starts_on: "2024-06-01" },
    session,
  );

  expect(first.status).toBe(303);
  expect(first.headers.get("location")).toContain(`/personnel/${personnel.id}/postings`);
  expect(second.status).toBe(303);
  const rows = await Posting.query().where("personnel_id", personnel.id).orderBy("id").get();
  expect(rows).toHaveLength(2);
  expect(String(rows[0]?.getAttribute("ends_on")).slice(0, 10)).toBe("2024-05-31");
  expect(rows[1]?.getAttribute("ends_on")).toBeNull();
  expect(Number(rows[1]?.getAttribute("mission_id"))).toBe(dakar);
});

test("invalid posting input is rejected", async () => {
  const personnel = await createPersonnel("Invalid Posting");
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);

  const response = await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: "1" },
    session,
  );

  expect(response.status).toBe(422);
  expect(await Posting.query().where("personnel_id", personnel.id).get()).toHaveLength(0);
});

test("a posting that starts too early is refused and the open posting stays open", async () => {
  const personnel = await createPersonnel("Early Posting");
  const mission = await createMission("Early Mission");
  const session = await login((await createUser(RoleSlug.Administrator, null, null)).email);
  await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: String(mission), starts_on: "2024-06-01" },
    session,
  );

  const response = await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: String(mission), starts_on: "2020-01-01" },
    session,
  );

  expect(response.status).toBe(422);
  const rows = await Posting.query().where("personnel_id", personnel.id).get();
  expect(rows).toHaveLength(1);
  expect(rows[0]?.getAttribute("ends_on")).toBeNull();
});

test("a Foreign Service Officer cannot assign a posting", async () => {
  const personnel = await createPersonnel("Officer Posting");
  const mission = await createMission("Officer Mission");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await post(
    `/personnel/${personnel.id}/postings`,
    { mission_id: String(mission), starts_on: "2024-06-01" },
    session,
  );

  expect(response.status).toBe(403);
  expect(await Posting.query().where("personnel_id", personnel.id).get()).toHaveLength(0);
});

test("a Foreign Service Officer can open the leave form and submit their own leave", async () => {
  const personnel = await createPersonnel("Leave Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const form = await get("/leave/create", session);
  const submitted = await post(
    "/leave",
    {
      personnel_id: String(personnel.id),
      leave_type: "annual",
      starts_on: "2026-10-10",
      ends_on: "2026-10-15",
    },
    session,
  );

  expect(form.status).toBe(200);
  expect(await form.text()).toContain("Leave\\/Create");
  expect(submitted.status).toBe(303);
  expect(submitted.headers.get("location")).toContain("/leave");
  const application = await LeaveApplication.query()
    .where("personnel_id", personnel.id)
    .first();
  expect(application?.getAttribute("status")).toBe("pending");

  const list = await get("/leave", session);
  const page = await list.text();
  expect(list.status).toBe(200);
  expect(page).toContain("Leave\\/Index");
  expect(page).toContain("pending");
});

test("a Foreign Service Officer cannot submit leave for another personnel record", async () => {
  const own = await createPersonnel("Own Leave");
  const other = await createPersonnel("Other Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, own.id, null);
  const session = await login(officer.email);

  const response = await post(
    "/leave",
    {
      personnel_id: String(other.id),
      leave_type: "casual",
      starts_on: "2026-11-01",
      ends_on: "2026-11-02",
    },
    session,
  );

  expect(response.status).toBe(403);
  expect(await LeaveApplication.query().where("personnel_id", other.id).get()).toHaveLength(0);
});

test("a second pending leave application is refused", async () => {
  const personnel = await createPersonnel("Second Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);
  await submitLeave(personnel.id, session, "2026-10-10", "2026-10-12");

  const response = await submitLeave(personnel.id, session, "2026-11-01", "2026-11-03");

  expect(response.status).toBe(422);
  expect(await LeaveApplication.query().where("personnel_id", personnel.id).get()).toHaveLength(1);
});

test("the Permanent Secretary can approve leave and the page shows the due-back date", async () => {
  const personnel = await createPersonnel("Approved Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const secretary = await createUser(RoleSlug.PermanentSecretary, null, null);
  await submitLeave(personnel.id, await login(officer.email), "2026-10-10", "2026-10-15");
  const application = await LeaveApplication.query().where("personnel_id", personnel.id).first();
  const session = await login(secretary.email);

  const response = await post(`/leave/${application?.id}/approve`, {}, session);

  expect(response.status).toBe(303);
  expect((await LeaveApplication.find(Number(application?.id)))?.getAttribute("status")).toBe(
    "approved",
  );
  const page = await get("/leave", session);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain("2026-10-16");
});

test("the Permanent Secretary can reject leave", async () => {
  const personnel = await createPersonnel("Rejected Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const secretary = await createUser(RoleSlug.PermanentSecretary, null, null);
  await submitLeave(personnel.id, await login(officer.email), "2026-12-01", "2026-12-02");
  const application = await LeaveApplication.query().where("personnel_id", personnel.id).first();

  const response = await post(
    `/leave/${application?.id}/reject`,
    {},
    await login(secretary.email),
  );

  expect(response.status).toBe(303);
  expect((await LeaveApplication.find(Number(application?.id)))?.getAttribute("status")).toBe(
    "rejected",
  );
});

test("an Administrator, Honorable Minister, and Foreign Service Officer cannot decide leave", async () => {
  const personnel = await createPersonnel("Undecided Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const minister = await createUser(RoleSlug.HonorableMinister, null, null);
  await submitLeave(personnel.id, await login(officer.email), "2026-08-01", "2026-08-02");
  const application = await LeaveApplication.query().where("personnel_id", personnel.id).first();
  const actors = [admin.email, minister.email, officer.email];

  for (const email of actors) {
    const response = await post(
      `/leave/${application?.id}/approve`,
      {},
      await login(email),
    );
    expect(response.status).toBe(403);
  }

  expect((await LeaveApplication.find(Number(application?.id)))?.getAttribute("status")).toBe(
    "pending",
  );
});

test("an already decided leave application cannot be decided again", async () => {
  const personnel = await createPersonnel("Closed Leave");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const secretary = await createUser(RoleSlug.PermanentSecretary, null, null);
  await submitLeave(personnel.id, await login(officer.email), "2026-09-01", "2026-09-02");
  const application = await LeaveApplication.query().where("personnel_id", personnel.id).first();
  const session = await login(secretary.email);
  await post(`/leave/${application?.id}/approve`, {}, session);

  const again = await post(`/leave/${application?.id}/reject`, {}, session);

  expect(again.status).toBe(422);
  expect((await LeaveApplication.find(Number(application?.id)))?.getAttribute("status")).toBe(
    "approved",
  );
});

test("an Administrator cannot open the leave list", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);

  const response = await get("/leave", await login(admin.email));

  expect(response.status).toBe(403);
});

async function submitLeave(
  personnelId: number,
  session: Session,
  startsOn: string,
  endsOn: string,
): Promise<Response> {
  return post(
    "/leave",
    {
      personnel_id: String(personnelId),
      leave_type: "annual",
      starts_on: startsOn,
      ends_on: endsOn,
    },
    session,
  );
}

async function createUser(
  role: (typeof RoleSlug)[keyof typeof RoleSlug],
  personnelId: number | null,
  missionId: number | null,
): Promise<{ email: string }> {
  const email = `${role}-${crypto.randomUUID()}@example.test`;
  await User.create({
    name: role,
    email,
    password,
    role_id: await roleId(role),
    personnel_id: personnelId,
    mission_id: missionId,
    email_verified_at: null,
  });
  return { email };
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
    [`${name} ${crypto.randomUUID().slice(0, 8)}`, now, now],
  );
  return Number(inserted.lastInsertId);
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
