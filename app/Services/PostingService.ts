import { HttpException, type Connection } from "bun-jcc";
import type { Actor } from "../Auth/Actor";
import { PostingPolicy } from "../Policies/PostingPolicy";
import { PostingAssignmentError } from "./PostingAssignmentError";
import { dayBefore } from "./PostingDuration";

export type AssignPostingInput = {
  personnelId: number;
  missionId: number;
  startsOn: string;
};

type PostingRow = {
  id: number;
  personnel_id: number;
  mission_id: number;
  starts_on: string;
  ends_on: string | null;
};

/**
 * Implements posting assignment.
 * PO-06 closes the previous posting when an officer is reassigned.
 * One open posting per officer is enforced here, not by a database constraint.
 */
export class PostingService {
  constructor(private readonly connection: Connection) {}

  async assign(actor: Actor, input: AssignPostingInput): Promise<PostingRow> {
    if (!new PostingPolicy().reassign(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return this.connection.transaction(async () => {
      const open = await this.openPostings(input.personnelId);

      if (open.length > 1) {
        throw new PostingAssignmentError(
          "This officer has more than one open posting.",
        );
      }

      const current = open[0];
      if (current) {
        const endsOn = dayBefore(input.startsOn);
        if (endsOn < current.starts_on.slice(0, 10)) {
          throw new PostingAssignmentError(
            "The new posting must start after the current posting.",
          );
        }

        await this.connection
          .table("postings")
          .where("id", current.id)
          .update({
            ends_on: endsOn,
            updated_at: timestamp(),
          });
      }

      const id = await this.connection.table("postings").insertGetId({
        personnel_id: input.personnelId,
        mission_id: input.missionId,
        starts_on: input.startsOn,
        ends_on: null,
        created_at: timestamp(),
        updated_at: timestamp(),
      });

      const created = await this.connection
        .table<PostingRow>("postings")
        .where("id", Number(id))
        .first();

      if (!created) {
        throw new PostingAssignmentError("The posting could not be saved.");
      }

      return created;
    });
  }

  private openPostings(personnelId: number): Promise<PostingRow[]> {
    return this.connection
      .table<PostingRow>("postings")
      .where("personnel_id", personnelId)
      .whereNull("ends_on")
      .get();
  }
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
