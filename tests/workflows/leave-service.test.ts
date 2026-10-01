import { afterEach, expect, test } from "bun:test";
import { join } from "node:path";
import { DatabaseManager, HttpException, Model, type Connection } from "bun-jcc";
import { QueueManager } from "bun-jcc/Queue/QueueManager";
import { setDatabaseManager } from "bun-jcc/Support/Facades/DB";
import { setQueueManager } from "bun-jcc/Support/Facades/Queue";
import { Migrator } from "bun-jcc/Database/Migrations/Migrator";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { dueBackOn } from "../../app/Services/LeaveDates";
import type { LeaveActor } from "../../app/Services/LeaveService";
import { LeaveService } from "../../app/Services/LeaveService";
import type { LeaveSubmissionNotice } from "../../app/Services/LeaveSubmissionNotifier";
import { LeaveWorkflowError } from "../../app/Services/LeaveWorkflowError";
import { QueueLeaveSubmitted } from "../../app/Services/QueueLeaveSubmitted";

const migrationsDirectory = join(import.meta.dir, "../../database/migrations");

const validLeave = {
  leaveType: "annual",
  startsOn: "2026-10-10",
  endsOn: "2026-10-15",
} as const;

let database: DatabaseManager | null = null;

afterEach(async () => {
  if (database) {
    await database.disconnect();
  }

  database = null;
  Model.useDatabase(null);
});

test("an officer submits valid leave as pending without copying a name", async () => {
  const { service, personnelId, connection } = await boot();

  const row = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });

  expect(row).toMatchObject({
    personnel_id: personnelId,
    leave_type: "annual",
    starts_on: "2026-10-10",
    ends_on: "2026-10-15",
    status: "pending",
  });
  expect(row).not.toHaveProperty("full_name");
  expect(row).not.toHaveProperty("designation");

  const stored = await connection
    .table<Record<string, unknown>>("leave_applications")
    .where("id", row.id)
    .first();
  expect(stored).not.toHaveProperty("full_name");
  expect(stored).not.toHaveProperty("designation");
});

test("a leave application is refused when the end date is before the start date", async () => {
  const { service, personnelId, connection, queued } = await boot();

  await expect(
    service.submit(officer(personnelId), {
      personnelId,
      leaveType: "casual",
      startsOn: "2026-10-15",
      endsOn: "2026-10-10",
    }),
  ).rejects.toBeInstanceOf(LeaveWorkflowError);

  expect(await connection.table("leave_applications").get()).toHaveLength(0);
  expect(queued).toHaveLength(0);
});

test("a second pending application is refused while the setting is on", async () => {
  const { service, personnelId } = await boot({ refuseSecondPending: true });
  await service.submit(officer(personnelId), { personnelId, ...validLeave });

  await expect(
    service.submit(officer(personnelId), {
      personnelId,
      leaveType: "casual",
      startsOn: "2026-11-01",
      endsOn: "2026-11-02",
    }),
  ).rejects.toBeInstanceOf(LeaveWorkflowError);
});

test("a second pending application is allowed while the setting is off", async () => {
  const { service, personnelId, connection } = await boot({ refuseSecondPending: false });
  await service.submit(officer(personnelId), { personnelId, ...validLeave });
  await service.submit(officer(personnelId), {
    personnelId,
    leaveType: "casual",
    startsOn: "2026-11-01",
    endsOn: "2026-11-02",
  });

  const rows = await connection
    .table<{ status: string }>("leave_applications")
    .where("personnel_id", personnelId)
    .get();
  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row.status === "pending")).toBe(true);
});

test("a failed insert after the pending check leaves no application row", async () => {
  const { service, connection, queued } = await boot();

  await expect(
    service.submit(officer(99999), {
      personnelId: 99999,
      ...validLeave,
    }),
  ).rejects.toThrow();

  expect(await connection.table("leave_applications").get()).toHaveLength(0);
  expect(await connection.table("audit_logs").get()).toHaveLength(0);
  expect(queued).toHaveLength(0);
});

test("an officer cannot submit leave for another personnel record", async () => {
  const { service, personnelId, otherPersonnelId, connection } = await boot();

  await expect(
    service.submit(officer(personnelId), {
      personnelId: otherPersonnelId,
      ...validLeave,
    }),
  ).rejects.toBeInstanceOf(HttpException);

  expect(await connection.table("leave_applications").get()).toHaveLength(0);
});

test("the Permanent Secretary approves a pending application", async () => {
  const { service, personnelId } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });

  const approved = await service.approve(permanentSecretary(), submitted.id);

  expect(approved.status).toBe("approved");
});

test("the Permanent Secretary rejects a pending application", async () => {
  const { service, personnelId } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });

  const rejected = await service.reject(permanentSecretary(), submitted.id);

  expect(rejected.status).toBe("rejected");
});

test("the Honorable Minister cannot decide a leave application", async () => {
  const { service, personnelId, connection } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  const minister: LeaveActor = {
    role: RoleSlug.HonorableMinister,
    personnelId: null,
    missionId: null,
    userId: null,
  };

  await expect(service.approve(minister, submitted.id)).rejects.toBeInstanceOf(HttpException);
  await expect(service.reject(minister, submitted.id)).rejects.toBeInstanceOf(HttpException);

  const row = await connection
    .table<{ status: string }>("leave_applications")
    .where("id", submitted.id)
    .first();
  expect(row?.status).toBe("pending");
});

test("other roles cannot decide a leave application", async () => {
  const { service, personnelId } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  const actors: LeaveActor[] = [
    {
      role: RoleSlug.Administrator,
      personnelId: null,
      missionId: null,
      userId: null,
    },
    officer(personnelId),
    {
      role: RoleSlug.MissionPostUser,
      personnelId: null,
      missionId: 1,
      userId: null,
    },
  ];

  for (const actor of actors) {
    await expect(service.approve(actor, submitted.id)).rejects.toBeInstanceOf(HttpException);
    await expect(service.reject(actor, submitted.id)).rejects.toBeInstanceOf(HttpException);
  }
});

test("an already approved application cannot be decided again", async () => {
  const { service, personnelId } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  await service.approve(permanentSecretary(), submitted.id);

  await expect(service.approve(permanentSecretary(), submitted.id)).rejects.toBeInstanceOf(
    LeaveWorkflowError,
  );
  await expect(service.reject(permanentSecretary(), submitted.id)).rejects.toBeInstanceOf(
    LeaveWorkflowError,
  );
});

test("an already rejected application cannot be decided again", async () => {
  const { service, personnelId } = await boot();
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  await service.reject(permanentSecretary(), submitted.id);

  await expect(service.approve(permanentSecretary(), submitted.id)).rejects.toBeInstanceOf(
    LeaveWorkflowError,
  );
  await expect(service.reject(permanentSecretary(), submitted.id)).rejects.toBeInstanceOf(
    LeaveWorkflowError,
  );
});

test("due-back is the calendar day after the end date", () => {
  expect(dueBackOn("2026-10-15")).toBe("2026-10-16");
  expect(dueBackOn("2026-10-31")).toBe("2026-11-01");
  expect(dueBackOn("2024-02-29")).toBe("2024-03-01");
  expect(dueBackOn("2026-12-31")).toBe("2027-01-01");
});

test("submitting leave writes the audit row with the application", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "officer@example.test");
  const row = await service.submit(officer(personnelId, userId), {
    personnelId,
    ...validLeave,
  });

  const audit = await auditRows(connection);
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({
    user_id: userId,
    action: "leave.submitted",
    module: "leave",
    subject_type: "leave_application",
    subject_id: row.id,
    before: null,
  });
  expect(jsonValue(audit[0]?.after)).toMatchObject({
    status: "pending",
    personnel_id: personnelId,
    actor: { role: RoleSlug.ForeignServiceOfficer, personnelId },
  });
  expect(JSON.stringify(audit[0]?.after)).not.toContain("password");
  expect(JSON.stringify(audit[0]?.after)).not.toContain("full_name");
  expect(JSON.stringify(audit[0]?.after)).not.toContain("designation");
});

test("approval writes the audit row with the decision", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "secretary@example.test");
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  await service.approve(permanentSecretary(userId), submitted.id);

  const audit = await auditRows(connection);
  const approval = audit.find((row) => row.action === "leave.approved");
  expect(jsonValue(approval?.before)).toMatchObject({ status: "pending" });
  expect(jsonValue(approval?.after)).toMatchObject({
    status: "approved",
    actor: { role: RoleSlug.PermanentSecretary },
  });
  expect(approval?.user_id).toBe(userId);
});

test("rejection writes the audit row with the decision", async () => {
  const { service, personnelId, connection } = await boot();
  const userId = await insertUser(connection, "secretary@example.test");
  const submitted = await service.submit(officer(personnelId), {
    personnelId,
    ...validLeave,
  });
  await service.reject(permanentSecretary(userId), submitted.id);

  const audit = await auditRows(connection);
  const rejection = audit.find((row) => row.action === "leave.rejected");
  expect(jsonValue(rejection?.before)).toMatchObject({ status: "pending" });
  expect(jsonValue(rejection?.after)).toMatchObject({ status: "rejected" });
});

test("a failed transaction leaves no audit row and does not queue a notice", async () => {
  const { service, personnelId, connection, queued } = await boot();

  await expect(
    service.submit(officer(personnelId, 99999), {
      personnelId,
      ...validLeave,
    }),
  ).rejects.toThrow();

  expect(await connection.table("leave_applications").get()).toHaveLength(0);
  expect(await connection.table("audit_logs").get()).toHaveLength(0);
  expect(queued).toHaveLength(0);
});

test("the officer notice is queued only after the submission commits", async () => {
  const first = await boot({
    notify: {
      queue: async () => {
        throw new Error("queue down");
      },
    },
  });

  await expect(
    first.service.submit(officer(first.personnelId), {
      personnelId: first.personnelId,
      ...validLeave,
    }),
  ).rejects.toThrow("queue down");
  expect(await first.connection.table("leave_applications").get()).toHaveLength(1);
  expect(await first.connection.table("audit_logs").get()).toHaveLength(1);

  const second = await boot();
  await expect(
    second.service.submit(officer(99999), {
      personnelId: 99999,
      ...validLeave,
    }),
  ).rejects.toThrow();
  expect(second.queued).toHaveLength(0);
});

test("the submission notice is dispatched onto the queue", async () => {
  setQueueManager(
    new QueueManager(
      {
        default: "null",
        connections: { null: { driver: "null" } },
        failed: { table: "failed_jobs" },
      },
      null,
    ),
  );

  await new QueueLeaveSubmitted().queue({ applicationId: 4, personnelId: 9 });
});

function officer(personnelId: number, userId: number | null = null): LeaveActor {
  return {
    role: RoleSlug.ForeignServiceOfficer,
    personnelId,
    missionId: null,
    userId,
  };
}

function permanentSecretary(userId: number | null = null): LeaveActor {
  return {
    role: RoleSlug.PermanentSecretary,
    personnelId: null,
    missionId: null,
    userId,
  };
}

async function boot(options?: {
  refuseSecondPending?: boolean;
  notify?: { queue(notice: LeaveSubmissionNotice): Promise<void> };
}) {
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

  const personnelId = await insertPersonnel(connection, "Ama Jallow", "P701");
  const otherPersonnelId = await insertPersonnel(connection, "Lamin Bojang", "P702");
  const queued: LeaveSubmissionNotice[] = [];
  const notify = options?.notify ?? {
    queue: async (notice: LeaveSubmissionNotice) => {
      queued.push(notice);
    },
  };

  return {
    connection,
    personnelId,
    otherPersonnelId,
    queued,
    service: new LeaveService(connection, {
      refuseSecondPending: options?.refuseSecondPending ?? true,
      notify,
    }),
  };
}

async function insertUser(connection: Connection, email: string): Promise<number> {
  const inserted = await connection.execute(
    `insert into users (name, email, password, created_at, updated_at)
     values ('Test User', ?, 'hashed-secret', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [email],
  );
  return Number(inserted.lastInsertId);
}

async function insertPersonnel(
  connection: Connection,
  fullName: string,
  passport: string,
): Promise<number> {
  const inserted = await connection.execute(
    `insert into personnel (full_name, date_of_birth, passport_number, designation, created_at, updated_at)
     values (?, '1980-01-02', ?, 'Counsellor', '2026-10-01 12:00:00', '2026-10-01 12:00:00')`,
    [fullName, passport],
  );
  return Number(inserted.lastInsertId);
}

type AuditRow = {
  user_id: number | null;
  action: string;
  module: string;
  subject_type: string;
  subject_id: number;
  before: unknown;
  after: unknown;
};

function auditRows(connection: { table(name: string): { get(): Promise<AuditRow[]> } }): Promise<AuditRow[]> {
  return connection.table("audit_logs").get();
}

function jsonValue(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) : value;
}
