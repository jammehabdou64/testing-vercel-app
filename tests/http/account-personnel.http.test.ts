import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import { AppRequest } from "bun-jcc/Http/Request/Request";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { Personnel } from "../../app/Models/Personnel";
import { PersonnelDependent } from "../../app/Models/PersonnelDependent";
import { Role } from "../../app/Models/Role";
import { User } from "../../app/Models/User";
import { RoleSeeder } from "../../database/seeders/RoleSeeder";

const root = join(tmpdir(), `dpms-http-${crypto.randomUUID()}`);
mkdirSync(join(root, "sessions"), { recursive: true });
process.env.DB_CONNECTION = "sqlite";
process.env.DB_DATABASE = join(root, "test.sqlite");
process.env.SESSION_DRIVER = "file";
process.env.SESSION_FILES = join(root, "sessions");

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");
const password = "password1";

type Session = {
  cookie: string;
  token: string;
};

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

test("a guest who opens /accounts is redirected to /login", async () => {
  const response = await get("/accounts");

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toContain("/login");
});

test("a guest can open the login page", async () => {
  const response = await get("/login");

  expect(response.status).toBe(200);
  expect(await response.text()).toContain(String.raw`Auth\/Login`);
});

test("GET /register and POST /register are not available", async () => {
  expect((await get("/register")).status).toBe(404);
  expect((await post("/register", {})).status).toBe(404);
});

test("a signed-in user can open /dashboard without verifying email", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const session = await login(admin.email);

  const dashboard = await get("/dashboard", session);
  const profile = await get("/profile", session);

  expect(dashboard.status).toBe(200);
  expect(await dashboard.text()).toContain("Dashboard");
  expect(profile.status).toBe(200);
  expect(await profile.text()).toContain(String.raw`Profile\/Edit`);
});

test("an administrator can create a Foreign Service Officer linked to personnel", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Linked Officer");
  const session = await login(admin.email);
  const email = uniqueEmail("officer");

  const response = await post(
    "/accounts",
    {
      name: "Linked Officer",
      email,
      password,
      role: RoleSlug.ForeignServiceOfficer,
      personnel_id: String(personnel.id),
    },
    session,
  );

  expect(response.status).toBe(303);
  const created = await User.where("email", email).first();
  expect(created?.getAttribute("personnel_id")).toBe(personnel.id);
  expect(created?.getAttribute("mission_id")).toBeNull();
  expect(created?.getAttribute("role_id")).toBe(await roleId(RoleSlug.ForeignServiceOfficer));
});

test("an administrator cannot create a Foreign Service Officer without personnel", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const session = await login(admin.email);
  const email = uniqueEmail("unlinked");

  const response = await post(
    "/accounts",
    {
      name: "Unlinked Officer",
      email,
      password,
      role: RoleSlug.ForeignServiceOfficer,
    },
    session,
  );

  expect(response.status).toBe(403);
  expect(await User.where("email", email).first()).toBeNull();
});

test("an administrator cannot create a Mission / Post User with a personnel link", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Not A Mission User");
  const session = await login(admin.email);
  const email = uniqueEmail("mission");

  const response = await post(
    "/accounts",
    {
      name: "Mission User",
      email,
      password,
      role: RoleSlug.MissionPostUser,
      personnel_id: String(personnel.id),
      mission_id: "1",
    },
    session,
  );

  expect(response.status).toBe(403);
  expect(await User.where("email", email).first()).toBeNull();
});

test("a non-administrator cannot create an account", async () => {
  const personnel = await createPersonnel("Officer Account");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);
  const email = uniqueEmail("blocked");

  const response = await post(
    "/accounts",
    {
      name: "Blocked",
      email,
      password,
      role: RoleSlug.Administrator,
    },
    session,
  );

  expect(response.status).toBe(403);
  expect(await User.where("email", email).first()).toBeNull();
});

test("a guest who opens /personnel is redirected to /login", async () => {
  const response = await get("/personnel");

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toContain("/login");
});

test("an administrator can create a personnel record", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const session = await login(admin.email);
  const passport = uniquePassport();

  const response = await post(
    "/personnel",
    {
      full_name: "New Officer",
      date_of_birth: "1980-01-02",
      passport_number: passport,
      designation: "Counsellor",
    },
    session,
  );

  expect(response.status).toBe(303);
  const created = await Personnel.where("passport_number", passport).first();
  expect(created?.getAttribute("full_name")).toBe("New Officer");
  expect(created?.getAttribute("photograph_path")).toBeNull();
});

test("a Foreign Service Officer cannot create a personnel record", async () => {
  const personnel = await createPersonnel("Existing Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);
  const passport = uniquePassport();

  const response = await post(
    "/personnel",
    {
      full_name: "Smuggled",
      date_of_birth: "1981-02-03",
      passport_number: passport,
      designation: "Attache",
    },
    session,
  );

  expect(response.status).toBe(403);
  expect(await Personnel.where("passport_number", passport).first()).toBeNull();
});

test("an administrator can update a personnel record", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Before Update");
  const session = await login(admin.email);

  const response = await send(
    "PUT",
    `/personnel/${personnel.id}`,
    {
      full_name: "After Update",
      date_of_birth: "1980-01-02",
      passport_number: String(personnel.getAttribute("passport_number")),
      designation: "Minister Counsellor",
    },
    session,
  );

  expect(response.status).toBe(303);
  const updated = await Personnel.find(personnel.id);
  expect(updated?.getAttribute("full_name")).toBe("After Update");
});

test("a Foreign Service Officer can view their own personnel record", async () => {
  const personnel = await createPersonnel("Own Record");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await get(`/personnel/${personnel.id}`, session);

  expect(response.status).toBe(200);
  expect(await response.text()).toContain("Own Record");
});

test("a Foreign Service Officer cannot view another personnel record", async () => {
  const own = await createPersonnel("Own Record Two");
  const other = await createPersonnel("Other Record");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, own.id, null);
  const session = await login(officer.email);

  const response = await get(`/personnel/${other.id}`, session);

  expect(response.status).toBe(403);
});

test("the Honorable Minister cannot list personnel", async () => {
  const minister = await createUser(RoleSlug.HonorableMinister, null, null);
  const session = await login(minister.email);

  const response = await get("/personnel", session);

  expect(response.status).toBe(403);
});

test("there is no route that deletes a personnel record", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Kept");
  const session = await login(admin.email);

  const response = await send("DELETE", `/personnel/${personnel.id}`, {}, session);

  expect(response.status).toBe(404);
  expect(await Personnel.find(personnel.id)).not.toBeNull();
});

test("an administrator can upload a personnel photograph", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Photographed");
  const session = await login(admin.email);

  const response = await uploadPhotograph(personnel.id, session, jpeg(), "portrait.jpg", "image/jpeg");

  expect(response.status).toBe(303);
  const updated = await Personnel.find(personnel.id);
  expect(String(updated?.getAttribute("photograph_path"))).toMatch(
    new RegExp(`^photographs/personnel/${personnel.id}/.+\.jpg$`),
  );
});

test("a Foreign Service Officer cannot upload a personnel photograph", async () => {
  const personnel = await createPersonnel("No Upload");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await uploadPhotograph(personnel.id, session, jpeg(), "portrait.jpg", "image/jpeg");

  expect(response.status).toBe(403);
  expect((await Personnel.find(personnel.id))?.getAttribute("photograph_path")).toBeNull();
});

test("a photograph named .jpg is rejected when the bytes are not a JPEG", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Bad Bytes");
  const session = await login(admin.email);
  const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

  const response = await uploadPhotograph(personnel.id, session, gif, "portrait.jpg", "image/jpeg");

  expect(response.status).toBe(422);
  expect((await Personnel.find(personnel.id))?.getAttribute("photograph_path")).toBeNull();
});

test("an administrator can create a Mission / Post User linked only to a mission", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const missionId = await createMission("Embassy in Dakar");
  const session = await login(admin.email);
  const email = uniqueEmail("post");

  const response = await post(
    "/accounts",
    {
      name: "Dakar Desk",
      email,
      password,
      role: RoleSlug.MissionPostUser,
      mission_id: String(missionId),
    },
    session,
  );

  expect(response.status).toBe(303);
  const created = await User.where("email", email).first();
  expect(created?.getAttribute("mission_id")).toBe(missionId);
  expect(created?.getAttribute("personnel_id")).toBeNull();
});

test("an administrator can update an account assignment", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Reassigned Account");
  const officer = await createUser(RoleSlug.HonorableMinister, null, null);
  const account = await User.where("email", officer.email).first();
  const session = await login(admin.email);

  const response = await send(
    "PUT",
    `/accounts/${account?.id}`,
    {
      name: "Now An Officer",
      email: officer.email,
      role: RoleSlug.ForeignServiceOfficer,
      personnel_id: String(personnel.id),
    },
    session,
  );

  expect(response.status).toBe(303);
  const updated = await User.find(Number(account?.id));
  expect(updated?.getAttribute("name")).toBe("Now An Officer");
  expect(updated?.getAttribute("personnel_id")).toBe(personnel.id);
  expect(updated?.getAttribute("role_id")).toBe(await roleId(RoleSlug.ForeignServiceOfficer));
});

test("a non-administrator cannot open the account list", async () => {
  const personnel = await createPersonnel("Listed Officer");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await get("/accounts", session);

  expect(response.status).toBe(403);
});

test("a Foreign Service Officer cannot update a personnel record", async () => {
  const personnel = await createPersonnel("Unchanged");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await send(
    "PUT",
    `/personnel/${personnel.id}`,
    {
      full_name: "Changed",
      date_of_birth: "1980-01-02",
      passport_number: String(personnel.getAttribute("passport_number")),
      designation: "Counsellor",
    },
    session,
  );

  expect(response.status).toBe(403);
  expect((await Personnel.find(personnel.id))?.getAttribute("full_name")).toBe("Unchanged");
});

test("an administrator can add, update, and remove a personnel dependent", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const personnel = await createPersonnel("Parent Officer");
  const session = await login(admin.email);

  const created = await post(
    `/personnel/${personnel.id}/dependents`,
    { full_name: "Child One", relationship: "child" },
    session,
  );
  expect(created.status).toBe(303);
  const dependent = await PersonnelDependent.where("full_name", "Child One").first();
  expect(dependent?.getAttribute("personnel_id")).toBe(personnel.id);

  const updated = await send(
    "PUT",
    `/personnel/${personnel.id}/dependents/${dependent?.id}`,
    { full_name: "Child Renamed", relationship: "daughter" },
    session,
  );
  expect(updated.status).toBe(303);
  expect((await PersonnelDependent.find(Number(dependent?.id)))?.getAttribute("full_name")).toBe(
    "Child Renamed",
  );

  const removed = await send(
    "DELETE",
    `/personnel/${personnel.id}/dependents/${dependent?.id}`,
    {},
    session,
  );
  expect(removed.status).toBe(303);
  expect(await PersonnelDependent.find(Number(dependent?.id))).toBeNull();
});

test("a Foreign Service Officer cannot add a dependent", async () => {
  const personnel = await createPersonnel("Officer Parent");
  const officer = await createUser(RoleSlug.ForeignServiceOfficer, personnel.id, null);
  const session = await login(officer.email);

  const response = await post(
    `/personnel/${personnel.id}/dependents`,
    { full_name: "Not Allowed", relationship: "child" },
    session,
  );

  expect(response.status).toBe(403);
  expect(await PersonnelDependent.where("full_name", "Not Allowed").first()).toBeNull();
});

test("a dependent update for a different personnel record is not found", async () => {
  const admin = await createUser(RoleSlug.Administrator, null, null);
  const parent = await createPersonnel("Real Parent");
  const other = await createPersonnel("Other Parent");
  const session = await login(admin.email);
  await post(
    `/personnel/${parent.id}/dependents`,
    { full_name: "Kept Child", relationship: "child" },
    session,
  );
  const dependent = await PersonnelDependent.where("full_name", "Kept Child").first();

  const response = await send(
    "PUT",
    `/personnel/${other.id}/dependents/${dependent?.id}`,
    { full_name: "Moved Child", relationship: "child" },
    session,
  );

  expect(response.status).toBe(404);
  expect((await PersonnelDependent.find(Number(dependent?.id)))?.getAttribute("full_name")).toBe(
    "Kept Child",
  );
});

async function createUser(
  role: (typeof RoleSlug)[keyof typeof RoleSlug],
  personnelId: number | null,
  missionId: number | null,
): Promise<{ email: string }> {
  const email = uniqueEmail(role);
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
    passport_number: uniquePassport(),
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

async function roleId(slug: string): Promise<number> {
  const role = await Role.where("slug", slug).first();
  if (!role) {
    throw new Error(`Missing role ${slug}.`);
  }
  return Number(role.id);
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.test`;
}

function uniquePassport(): string {
  return `P${crypto.randomUUID().slice(0, 8)}`;
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
  personnelId: number,
  session: Session,
  bytes: Uint8Array,
  filename: string,
  type: string,
): Promise<Response> {
  const form = new FormData();
  form.append("_token", session.token);
  form.append("photograph", new File([Uint8Array.from(bytes)], filename, { type }));
  return application.handle(
    new AppRequest(
      new Request(`http://localhost/personnel/${personnelId}/photograph`, {
        method: "POST",
        headers: {
          cookie: session.cookie,
          "x-xsrf-token": session.token,
        },
        body: form,
      }),
    ),
  );
}

async function login(email: string): Promise<Session> {
  const guest = await openSession();
  const response = await send(
    "POST",
    "/login",
    { email, password },
    guest,
  );
  if (response.status !== 303 && response.status !== 302) {
    throw new Error(`Login failed with ${response.status}: ${await response.text()}`);
  }
  return readSession(response, guest);
}

async function openSession(): Promise<Session> {
  const response = await get("/login");
  return readSession(response, { cookie: "", token: "" });
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
