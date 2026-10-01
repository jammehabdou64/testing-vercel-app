import { HttpException, type Connection } from "bun-jcc";
import type { Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";
import { VacationNotificationPolicy } from "../Policies/VacationNotificationPolicy";
import { calendarDate, formatDate } from "./LeaveDates";
import { LeaveWorkflowError } from "./LeaveWorkflowError";
import { VacationWorkflowError } from "./VacationWorkflowError";

export type VacationActor = Actor & {
  userId: number | null;
};

export type FileVacationInput = {
  travellingCountry: string;
  reason: string;
  submittedOn: string;
};

export type VacationNotificationRow = {
  id: number;
  personnel_id: number;
  travelling_country: string;
  reason: string;
  submitted_on: string;
};

/**
 * File one vacation notification.
 *
 * The personnel record is the actor's own link. The input does not choose it.
 * Name and designation stay on the Personnel record.
 */
export class VacationNotificationService {
  constructor(private readonly connection: Connection) {}

  async file(actor: VacationActor, input: FileVacationInput): Promise<VacationNotificationRow> {
    if (
      actor.personnelId === null ||
      !new VacationNotificationPolicy().create(actor, actor.personnelId)
    ) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const travellingCountry = input.travellingCountry.trim();
    const reason = input.reason.trim();
    if (travellingCountry === "") {
      throw new VacationWorkflowError("The travelling country is required.");
    }
    if (reason === "") {
      throw new VacationWorkflowError("The reason is required.");
    }

    const submittedOn = submissionDate(input.submittedOn);
    const id = await this.connection.table("vacation_notifications").insertGetId({
      personnel_id: actor.personnelId,
      travelling_country: travellingCountry,
      reason,
      submitted_on: submittedOn,
      created_at: timestamp(),
      updated_at: timestamp(),
    });

    const row = await this.connection
      .table<VacationNotificationRow>("vacation_notifications")
      .where("id", Number(id))
      .first();
    if (!row) {
      throw new VacationWorkflowError("The vacation notification could not be saved.");
    }

    return {
      id: Number(row.id),
      personnel_id: Number(row.personnel_id),
      travelling_country: row.travelling_country,
      reason: row.reason,
      submitted_on: String(row.submitted_on).slice(0, 10),
    };
  }

  /** Notices the submitting officer or an Administrator may see. */
  async visibleTo(actor: VacationActor): Promise<VacationNotificationRow[]> {
    if (!this.canList(actor)) {
      return [];
    }

    let query = this.connection
      .table<VacationNotificationRow>("vacation_notifications")
      .orderBy("id");
    if (actor.role === RoleSlug.ForeignServiceOfficer && actor.personnelId !== null) {
      query = query.where("personnel_id", actor.personnelId);
    }

    const rows = await query.get();
    return rows.map((row) => ({
      id: Number(row.id),
      personnel_id: Number(row.personnel_id),
      travelling_country: row.travelling_country,
      reason: row.reason,
      submitted_on: String(row.submitted_on).slice(0, 10),
    }));
  }

  canList(actor: VacationActor): boolean {
    if (actor.role === RoleSlug.Administrator) {
      return true;
    }

    return actor.role === RoleSlug.ForeignServiceOfficer && actor.personnelId !== null;
  }
}

function submissionDate(value: string): string {
  try {
    const date = calendarDate(value);
    return formatDate(date.year, date.month, date.day);
  } catch (error) {
    if (error instanceof LeaveWorkflowError) {
      throw new VacationWorkflowError("The submission date is not a calendar date.");
    }
    throw error;
  }
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
