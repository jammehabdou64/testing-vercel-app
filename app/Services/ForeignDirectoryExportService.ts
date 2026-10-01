import { HttpException, type Connection } from "bun-jcc";
import type { Actor } from "../Auth/Actor";
import { ForeignDiplomaticMissionPolicy } from "../Policies/ForeignDiplomaticMissionPolicy";
import {
  ForeignDirectoryPdf,
  type ForeignDirectoryDocument,
  type ForeignDirectoryPdfWriter,
  type ForeignDirectoryStaff,
} from "./ForeignDirectoryPdf";

export type ForeignDirectoryFilter = {
  country?: string | null;
  missionName?: string | null;
};

type MissionRow = {
  id: number;
  name: string;
  country: string;
  address: string;
  email: string;
  phone: string;
};

type StaffRow = {
  id: number;
  foreign_diplomatic_mission_id: number;
  full_name: string;
  nationality: string;
  passport_number: string;
  designation: string;
  country_represented: string;
  accreditation_starts_on: string;
  accreditation_ends_on: string | null;
  email: string | null;
  phone: string | null;
};

type DependentRow = {
  id: number;
  foreign_diplomatic_staff_id: number;
  full_name: string;
  relationship: string;
};

/**
 * Builds a PDF of the foreign diplomatic registry for the response.
 * Authorization uses ForeignDiplomaticMissionPolicy.export only.
 * The export is not stored and does not write an audit row.
 */
export class ForeignDirectoryExportService {
  constructor(
    private readonly connection: Connection,
    private readonly pdf: ForeignDirectoryPdfWriter = new ForeignDirectoryPdf(),
  ) {}

  async exportDirectory(
    actor: Actor,
    filter: ForeignDirectoryFilter = {},
  ): Promise<Uint8Array> {
    if (!new ForeignDiplomaticMissionPolicy().export(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const missions = await this.connection
      .table<MissionRow>("foreign_diplomatic_missions")
      .orderBy("id")
      .get();
    const selected = missions.filter(
      (mission) =>
        matches(mission.country, filter.country) &&
        matches(mission.name, filter.missionName),
    );
    const staff = await this.staffFor(
      selected.map((mission) => Number(mission.id)),
    );
    const dependents = await this.dependentsFor(
      staff.map((member) => Number(member.id)),
    );

    return this.pdf.render(this.document(selected, staff, dependents));
  }

  private async staffFor(missionIds: number[]): Promise<StaffRow[]> {
    if (missionIds.length === 0) {
      return [];
    }

    return this.connection
      .table<StaffRow>("foreign_diplomatic_staff")
      .whereIn("foreign_diplomatic_mission_id", missionIds)
      .orderBy("id")
      .get();
  }

  private async dependentsFor(staffIds: number[]): Promise<DependentRow[]> {
    if (staffIds.length === 0) {
      return [];
    }

    return this.connection
      .table<DependentRow>("foreign_diplomatic_dependents")
      .whereIn("foreign_diplomatic_staff_id", staffIds)
      .orderBy("id")
      .get();
  }

  private document(
    missions: MissionRow[],
    staff: StaffRow[],
    dependents: DependentRow[],
  ): ForeignDirectoryDocument {
    return {
      missions: missions.map((mission) => ({
        name: mission.name,
        country: mission.country,
        address: mission.address,
        email: mission.email,
        phone: mission.phone,
        staff: staff
          .filter(
            (member) =>
              Number(member.foreign_diplomatic_mission_id) ===
              Number(mission.id),
          )
          .map((member) => this.staffMember(member, dependents)),
      })),
    };
  }

  private staffMember(
    member: StaffRow,
    dependents: DependentRow[],
  ): ForeignDirectoryStaff {
    return {
      fullName: member.full_name,
      nationality: member.nationality,
      passportNumber: member.passport_number,
      designation: member.designation,
      countryRepresented: member.country_represented,
      accreditationStartsOn: String(member.accreditation_starts_on).slice(
        0,
        10,
      ),
      accreditationEndsOn: member.accreditation_ends_on
        ? String(member.accreditation_ends_on).slice(0, 10)
        : null,
      email: member.email,
      phone: member.phone,
      dependents: dependents
        .filter(
          (dependent) =>
            Number(dependent.foreign_diplomatic_staff_id) === Number(member.id),
        )
        .map((dependent) => ({
          fullName: dependent.full_name,
          relationship: dependent.relationship,
        })),
    };
  }
}

function matches(value: string, filter: string | null | undefined): boolean {
  if (filter == null || filter.trim() === "") {
    return true;
  }

  return value.toLowerCase().includes(filter.trim().toLowerCase());
}
