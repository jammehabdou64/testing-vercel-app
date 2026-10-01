import { HttpException, type Connection } from "bun-jcc";
import type { FilesystemAdapter } from "bun-jcc/Filesystem/FilesystemAdapter";
import type { Actor } from "../Auth/Actor";
import { RoleSlug } from "../Auth/RoleSlug";
import { CorrespondencePolicy } from "../Policies/CorrespondencePolicy";
import {
  CorrespondencePdf,
  type CorrespondencePdfWriter,
} from "./CorrespondencePdf";
import { CorrespondenceWorkflowError } from "./CorrespondenceWorkflowError";
import { calendarDate, formatDate } from "./LeaveDates";
import { LeaveWorkflowError } from "./LeaveWorkflowError";

export type CorrespondenceActor = Actor & {
  userId: number | null;
};

export type ComposeCorrespondenceInput = {
  toMissionId: number;
  body: string;
  composedOn: string;
};

export type CorrespondenceRow = {
  id: number;
  from_mission_id: number;
  to_mission_id: number;
  body: string;
  composed_on: string;
  pdf_path: string;
};

type MissionName = {
  id: number;
  name: string;
};

/**
 * Compose one shared letter.
 *
 * The viewer's mission is resolved first and becomes the sender.
 * The PDF is written on the private disk before the database transaction.
 * The correspondence row and the audit row commit together.
 * If that transaction fails, the stored PDF is deleted.
 */
export class CorrespondenceService {
  constructor(
    private readonly connection: Connection,
    private readonly privateDisk: FilesystemAdapter,
    private readonly pdf: CorrespondencePdfWriter = new CorrespondencePdf(),
  ) {}

  async compose(
    actor: CorrespondenceActor,
    input: ComposeCorrespondenceInput,
  ): Promise<CorrespondenceRow> {
    const fromMissionId = await this.viewerMission(actor);
    const openPostingMissionId =
      actor.role === RoleSlug.ForeignServiceOfficer ? fromMissionId : null;

    if (
      fromMissionId === null ||
      !new CorrespondencePolicy().compose(
        actor,
        fromMissionId,
        openPostingMissionId,
      )
    ) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const body = input.body.trim();
    if (body === "") {
      throw new CorrespondenceWorkflowError("The letter body is required.");
    }

    if (input.toMissionId === fromMissionId) {
      throw new CorrespondenceWorkflowError(
        "A letter cannot be sent to the same mission.",
      );
    }

    const composedOn = compositionDate(input.composedOn);
    const missions = await this.missionNames(fromMissionId, input.toMissionId);
    const fromMission = missions.get(fromMissionId);
    const toMission = missions.get(input.toMissionId);
    if (!fromMission) {
      throw new CorrespondenceWorkflowError(
        "The sending mission was not found.",
      );
    }
    if (!toMission) {
      throw new CorrespondenceWorkflowError(
        "The recipient mission was not found.",
      );
    }

    const pdfPath = `correspondence/${crypto.randomUUID()}.pdf`;
    const written = await this.privateDisk.put(
      pdfPath,
      this.pdf.render({
        fromMissionName: fromMission,
        toMissionName: toMission,
        composedOn,
        body,
      }),
    );
    if (written !== true) {
      throw new CorrespondenceWorkflowError(
        "The correspondence PDF could not be stored.",
      );
    }

    try {
      return await this.connection.transaction(async () => {
        const id = await this.connection.table("correspondence").insertGetId({
          from_mission_id: fromMissionId,
          to_mission_id: input.toMissionId,
          body,
          composed_on: composedOn,
          pdf_path: pdfPath,
          created_at: timestamp(),
          updated_at: timestamp(),
        });

        const row = await this.connection
          .table<CorrespondenceRow>("correspondence")
          .where("id", Number(id))
          .first();
        if (!row) {
          throw new CorrespondenceWorkflowError(
            "The correspondence could not be saved.",
          );
        }

        await this.connection.table("audit_logs").insert({
          user_id: actor.userId,
          action: "correspondence.composed",
          module: "correspondence",
          subject_type: "correspondence",
          subject_id: row.id,
          before: null,
          after: JSON.stringify({
            from_mission_id: Number(row.from_mission_id),
            to_mission_id: Number(row.to_mission_id),
            composed_on: String(row.composed_on).slice(0, 10),
            body: row.body,
            pdf_path: row.pdf_path,
            actor: {
              role: actor.role,
              personnelId: actor.personnelId,
              missionId: actor.missionId,
            },
          }),
          ip_address: null,
        });

        return row;
      });
    } catch (error) {
      await this.deleteStoredPdf(pdfPath);
      throw error;
    }
  }

  /** Letters whose sender or recipient is the viewer's mission. */
  async visibleTo(actor: CorrespondenceActor): Promise<CorrespondenceRow[]> {
    const missionId = await this.viewerMission(actor);
    if (missionId === null) {
      return [];
    }

    return this.connection
      .table<CorrespondenceRow>("correspondence")
      .where((query) => {
        query
          .where("from_mission_id", missionId)
          .orWhere("to_mission_id", missionId);
      })
      .orderBy("id")
      .get();
  }

  async viewerMission(actor: CorrespondenceActor): Promise<number | null> {
    if (actor.role === RoleSlug.MissionPostUser) {
      return actor.missionId;
    }

    if (
      actor.role === RoleSlug.ForeignServiceOfficer &&
      actor.personnelId !== null
    ) {
      return this.openPostingMissionId(actor.personnelId);
    }

    return null;
  }

  private async openPostingMissionId(
    personnelId: number,
  ): Promise<number | null> {
    const open = await this.connection
      .table<{ mission_id: number }>("postings")
      .where("personnel_id", personnelId)
      .whereNull("ends_on")
      .get();

    if (open.length !== 1) {
      return null;
    }

    return Number(open[0]?.mission_id);
  }

  /** Whether this actor's mission can be resolved and may compose. */
  async canCompose(actor: CorrespondenceActor): Promise<boolean> {
    const fromMissionId = await this.viewerMission(actor);
    if (fromMissionId === null) {
      return false;
    }

    const openPostingMissionId =
      actor.role === RoleSlug.ForeignServiceOfficer ? fromMissionId : null;
    return new CorrespondencePolicy().compose(
      actor,
      fromMissionId,
      openPostingMissionId,
    );
  }

  private async missionNames(
    fromMissionId: number,
    toMissionId: number,
  ): Promise<Map<number, string>> {
    const rows = await this.connection
      .table<MissionName>("missions")
      .whereIn("id", [fromMissionId, toMissionId])
      .get();
    return new Map(rows.map((row) => [Number(row.id), row.name]));
  }

  private async deleteStoredPdf(pdfPath: string): Promise<void> {
    try {
      await this.privateDisk.delete(pdfPath);
    } catch {
      // The database transaction has already rolled back.
    }
  }
}

function compositionDate(value: string): string {
  try {
    const date = calendarDate(value);
    return formatDate(date.year, date.month, date.day);
  } catch (error) {
    if (error instanceof LeaveWorkflowError) {
      throw new CorrespondenceWorkflowError(
        "The composition date is not a calendar date.",
      );
    }
    throw error;
  }
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
