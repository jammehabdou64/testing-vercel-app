import { HttpException, type Connection } from "bun-jcc";
import type { FilesystemAdapter } from "bun-jcc/Filesystem/FilesystemAdapter";
import type { Actor } from "../Auth/Actor";
import { ForeignDiplomaticStaffPolicy } from "../Policies/ForeignDiplomaticStaffPolicy";
import { PersonnelPolicy } from "../Policies/PersonnelPolicy";
import { PhotographUploadError } from "./PhotographUploadError";

const maximumBytes = 2_097_152;

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type PhotographActor = Actor & {
  userId: number | null;
};

/** Client content type and filename are ignored. The bytes decide the type. */
export type PhotographFile = {
  bytes: Uint8Array;
  contentType?: string | null;
  filename?: string | null;
};

export type PhotographReplacement = {
  photographPath: string;
};

type PhotoRow = {
  id: number;
  photograph_path: string | null;
};

/**
 * Replaces a photograph on the private disk.
 * The new file is written first. The path change and the audit row commit
 * together. The previous file is deleted only after that commit.
 * If the transaction fails, the new file is deleted and the previous file stays.
 */
export class PhotographService {
  constructor(
    private readonly connection: Connection,
    private readonly privateDisk: FilesystemAdapter,
  ) {}

  async replacePersonnel(
    actor: PhotographActor,
    personnelId: number,
    file: PhotographFile,
  ): Promise<PhotographReplacement> {
    if (!new PersonnelPolicy().update(actor, { id: personnelId })) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return this.replace({
      actor,
      table: "personnel",
      id: personnelId,
      folder: `photographs/personnel/${personnelId}`,
      missing: "The personnel record was not found.",
      module: "personnel",
      subjectType: "personnel",
      file,
    });
  }

  async replaceDiplomaticStaff(
    actor: PhotographActor,
    staffId: number,
    file: PhotographFile,
  ): Promise<PhotographReplacement> {
    if (!new ForeignDiplomaticStaffPolicy().update(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return this.replace({
      actor,
      table: "foreign_diplomatic_staff",
      id: staffId,
      folder: `photographs/diplomatic-staff/${staffId}`,
      missing: "The diplomatic staff record was not found.",
      module: "foreign_diplomatic_staff",
      subjectType: "foreign_diplomatic_staff",
      file,
    });
  }

  private async replace(input: {
    actor: PhotographActor;
    table: "personnel" | "foreign_diplomatic_staff";
    id: number;
    folder: string;
    missing: string;
    module: string;
    subjectType: string;
    file: PhotographFile;
  }): Promise<PhotographReplacement> {
    const extension = inspectPhotograph(input.file.bytes);
    const photographPath = `${input.folder}/${crypto.randomUUID()}.${extension}`;
    const written = await this.privateDisk.put(photographPath, input.file.bytes);
    if (written !== true) {
      throw new PhotographUploadError("The photograph could not be stored.");
    }

    let previous: string | null;
    try {
      previous = await this.connection.transaction(async () => {
        const current = await this.connection
          .table<PhotoRow>(input.table)
          .where("id", input.id)
          .first();
        if (!current) {
          throw new PhotographUploadError(input.missing);
        }

        const prior = current.photograph_path;
        await this.connection.table(input.table).where("id", input.id).update({
          photograph_path: photographPath,
          updated_at: timestamp(),
        });
        await this.connection.table("audit_logs").insert({
          user_id: input.actor.userId,
          action: "photograph.replaced",
          module: input.module,
          subject_type: input.subjectType,
          subject_id: input.id,
          before: JSON.stringify({ photograph_path: prior }),
          after: JSON.stringify({
            photograph_path: photographPath,
            actor: {
              role: input.actor.role,
              personnelId: input.actor.personnelId,
              missionId: input.actor.missionId,
            },
          }),
          ip_address: null,
        });
        return prior;
      });
    } catch (error) {
      await this.deleteQuietly(photographPath);
      throw error;
    }

    if (previous) {
      await this.deleteQuietly(previous);
    }

    return { photographPath };
  }

  private async deleteQuietly(path: string): Promise<void> {
    try {
      await this.privateDisk.delete(path);
    } catch {
      // A failed delete must not roll back a committed path change.
    }
  }
}

function inspectPhotograph(bytes: Uint8Array): "jpg" | "png" {
  if (bytes.byteLength === 0) {
    throw new PhotographUploadError("The photograph is empty.");
  }

  if (bytes.byteLength > maximumBytes) {
    throw new PhotographUploadError("The photograph must be 2 MB or smaller.");
  }

  if (isPng(bytes)) {
    return "png";
  }

  if (isJpeg(bytes)) {
    return "jpg";
  }

  throw new PhotographUploadError("The photograph must be a JPEG or PNG.");
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  return pngSignature.every((byte, index) => bytes[index] === byte);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
