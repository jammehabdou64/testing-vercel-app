import { HttpException, type Connection } from "bun-jcc";
import type { Actor } from "../Auth/Actor";
import { LeaveApplicationPolicy } from "../Policies/LeaveApplicationPolicy";
import { calendarDate, formatDate } from "./LeaveDates";
import type { LeaveSubmissionNotifier } from "./LeaveSubmissionNotifier";
import { LeaveWorkflowError } from "./LeaveWorkflowError";

export type LeaveType = "casual" | "annual";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveActor = Actor & {
  userId: number | null;
};

export type SubmitLeaveInput = {
  personnelId: number;
  leaveType: LeaveType;
  startsOn: string;
  endsOn: string;
};

export type LeaveApplicationRow = {
  id: number;
  personnel_id: number;
  leave_type: LeaveType;
  starts_on: string;
  ends_on: string;
  status: LeaveStatus;
};

export type LeaveServiceOptions = {
  /** Pass `config.leave.refuseSecondPending`. The default in config is true. */
  refuseSecondPending: boolean;
  notify: LeaveSubmissionNotifier;
};

type LeaveSnapshot = {
  personnel_id: number;
  leave_type: string;
  starts_on: string;
  ends_on: string;
  status: string;
};

/**
 * Leave submission and decision.
 *
 * submit: authorize, validate dates, then one transaction for the pending
 * check, the insert, and the audit row. The officer notice is queued only
 * after that transaction commits.
 * approve and reject: Permanent Secretary only, and only from pending.
 * The status change and the audit row commit together. They do not queue a notice.
 */
export class LeaveService {
  constructor(
    private readonly connection: Connection,
    private readonly options: LeaveServiceOptions,
  ) {}

  async submit(
    actor: LeaveActor,
    input: SubmitLeaveInput,
  ): Promise<LeaveApplicationRow> {
    if (!new LeaveApplicationPolicy().create(actor, input.personnelId)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const startsOn = isoDate(input.startsOn);
    const endsOn = isoDate(input.endsOn);
    if (endsOn < startsOn) {
      throw new LeaveWorkflowError(
        "The leave end date must be on or after the start date.",
      );
    }

    if (input.leaveType !== "casual" && input.leaveType !== "annual") {
      throw new LeaveWorkflowError("Leave type must be casual or annual.");
    }

    const created = await this.connection.transaction(async () => {
      if (this.options.refuseSecondPending) {
        const pending = await this.connection
          .table("leave_applications")
          .where("personnel_id", input.personnelId)
          .where("status", "pending")
          .get();

        if (pending.length > 0) {
          throw new LeaveWorkflowError(
            "This officer already has a pending leave application.",
          );
        }
      }

      const id = await this.connection.table("leave_applications").insertGetId({
        personnel_id: input.personnelId,
        leave_type: input.leaveType,
        starts_on: startsOn,
        ends_on: endsOn,
        status: "pending",
        created_at: timestamp(),
        updated_at: timestamp(),
      });

      const row = await this.find(Number(id));
      if (!row) {
        throw new LeaveWorkflowError(
          "The leave application could not be saved.",
        );
      }

      await this.writeAudit({
        userId: actor.userId,
        action: "leave.submitted",
        subjectId: row.id,
        before: null,
        after: this.auditAfter(actor, row),
      });

      return row;
    });

    await this.options.notify.queue({
      applicationId: created.id,
      personnelId: created.personnel_id,
    });

    return created;
  }

  async approve(
    actor: LeaveActor,
    applicationId: number,
  ): Promise<LeaveApplicationRow> {
    return this.decide(actor, applicationId, "approved", "leave.approved");
  }

  async reject(
    actor: LeaveActor,
    applicationId: number,
  ): Promise<LeaveApplicationRow> {
    return this.decide(actor, applicationId, "rejected", "leave.rejected");
  }

  private async decide(
    actor: LeaveActor,
    applicationId: number,
    status: "approved" | "rejected",
    action: "leave.approved" | "leave.rejected",
  ): Promise<LeaveApplicationRow> {
    if (!new LeaveApplicationPolicy().decide(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return this.connection.transaction(async () => {
      const current = await this.find(applicationId);
      if (!current) {
        throw new LeaveWorkflowError("The leave application was not found.");
      }

      if (current.status !== "pending") {
        throw new LeaveWorkflowError(
          "Only a pending application can be decided.",
        );
      }

      await this.connection
        .table("leave_applications")
        .where("id", applicationId)
        .update({
          status,
          updated_at: timestamp(),
        });

      const updated = await this.find(applicationId);
      if (!updated) {
        throw new LeaveWorkflowError("The leave application was not found.");
      }

      await this.writeAudit({
        userId: actor.userId,
        action,
        subjectId: updated.id,
        before: snapshot(current),
        after: this.auditAfter(actor, updated),
      });

      return updated;
    });
  }

  private find(id: number): Promise<LeaveApplicationRow | null> {
    return this.connection
      .table<LeaveApplicationRow>("leave_applications")
      .where("id", id)
      .first();
  }

  private auditAfter(
    actor: LeaveActor,
    row: LeaveApplicationRow,
  ): Record<string, unknown> {
    return {
      ...snapshot(row),
      actor: {
        role: actor.role,
        personnelId: actor.personnelId,
        missionId: actor.missionId,
      },
    };
  }

  private async writeAudit(entry: {
    userId: number | null;
    action: string;
    subjectId: number;
    before: LeaveSnapshot | null;
    after: Record<string, unknown>;
  }): Promise<void> {
    await this.connection.table("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      module: "leave",
      subject_type: "leave_application",
      subject_id: entry.subjectId,
      before: entry.before === null ? null : JSON.stringify(entry.before),
      after: JSON.stringify(entry.after),
      ip_address: null,
    });
  }
}

function snapshot(row: LeaveApplicationRow): LeaveSnapshot {
  return {
    personnel_id: Number(row.personnel_id),
    leave_type: row.leave_type,
    starts_on: String(row.starts_on).slice(0, 10),
    ends_on: String(row.ends_on).slice(0, 10),
    status: row.status,
  };
}

function isoDate(value: string): string {
  const date = calendarDate(value);
  return formatDate(date.year, date.month, date.day);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
