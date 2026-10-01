import { expect, test } from "bun:test";
import type { Actor } from "../../app/Auth/Actor";
import { RoleSlug } from "../../app/Auth/RoleSlug";
import { CorrespondencePolicy } from "../../app/Policies/CorrespondencePolicy";
import { ForeignDiplomaticMissionPolicy } from "../../app/Policies/ForeignDiplomaticMissionPolicy";
import { ForeignDiplomaticStaffPolicy } from "../../app/Policies/ForeignDiplomaticStaffPolicy";
import { LeaveApplicationPolicy } from "../../app/Policies/LeaveApplicationPolicy";
import { MissionPolicy } from "../../app/Policies/MissionPolicy";
import { PersonnelPolicy } from "../../app/Policies/PersonnelPolicy";
import { PostingPolicy } from "../../app/Policies/PostingPolicy";
import { UserPolicy } from "../../app/Policies/UserPolicy";
import { VacationNotificationPolicy } from "../../app/Policies/VacationNotificationPolicy";

const admin = actor(RoleSlug.Administrator, null, null);
const minister = actor(RoleSlug.HonorableMinister, null, null);
const secretary = actor(RoleSlug.PermanentSecretary, null, null);
const officer = actor(RoleSlug.ForeignServiceOfficer, 4, null);
const otherOfficer = actor(RoleSlug.ForeignServiceOfficer, 9, null);
const missionUser = actor(RoleSlug.MissionPostUser, null, 2);

test("personnel management is limited to an administrator and an officer's own record", () => {
  const policy = new PersonnelPolicy();
  const own = { id: 4 };
  const other = { id: 9 };

  expect(policy.create(admin)).toBe(true);
  expect(policy.create(officer)).toBe(false);
  expect(policy.update(admin, own)).toBe(true);
  expect(policy.update(officer, own)).toBe(false);
  expect(policy.view(officer, own)).toBe(true);
  expect(policy.view(officer, other)).toBe(false);
  expect(policy.view(minister, own)).toBe(false);
  expect(policy.delete(admin)).toBe(false);
  expect(policy.delete(officer)).toBe(false);
});

test("only an administrator reassigns a posting", () => {
  const policy = new PostingPolicy();
  const posting = { personnel_id: 4 };

  expect(policy.reassign(admin)).toBe(true);
  expect(policy.reassign(officer)).toBe(false);
  expect(policy.view(officer, posting)).toBe(true);
  expect(policy.view(otherOfficer, posting)).toBe(false);
  expect(policy.view(missionUser, posting)).toBe(false);
});

test("leave decisions belong to the Permanent Secretary", () => {
  const policy = new LeaveApplicationPolicy();
  const leave = { personnel_id: 4 };

  expect(policy.create(officer, 4)).toBe(true);
  expect(policy.create(officer, 9)).toBe(false);
  expect(policy.create(missionUser, 4)).toBe(false);
  expect(policy.view(officer, leave)).toBe(true);
  expect(policy.view(minister, leave)).toBe(true);
  expect(policy.view(secretary, leave)).toBe(true);
  expect(policy.view(admin, leave)).toBe(false);
  expect(policy.decide(secretary)).toBe(true);
  expect(policy.decide(minister)).toBe(false);
  expect(policy.decide(officer)).toBe(false);
});

test("vacation notifications are filed by the officer and viewed by that officer or an administrator", () => {
  const policy = new VacationNotificationPolicy();
  const notice = { personnel_id: 4 };

  expect(policy.create(officer, 4)).toBe(true);
  expect(policy.create(missionUser, 4)).toBe(false);
  expect(policy.view(officer, notice)).toBe(true);
  expect(policy.view(otherOfficer, notice)).toBe(false);
  expect(policy.view(admin, notice)).toBe(true);
  expect(policy.view(secretary, notice)).toBe(false);
});

test("correspondence access uses the viewer's mission and ignores the recipient", () => {
  const policy = new CorrespondencePolicy();
  const homeToDakar = { from_mission_id: 1, to_mission_id: 8 };
  const dakarToBanjul = { from_mission_id: 8, to_mission_id: 3 };

  expect(policy.compose(officer, 1, 1)).toBe(true);
  expect(policy.compose(officer, 8, 1)).toBe(false);
  expect(policy.compose(officer, 1, null)).toBe(false);
  expect(policy.compose(missionUser, 2, null)).toBe(true);
  expect(policy.compose(missionUser, 1, null)).toBe(false);
  expect(policy.compose(admin, 1, 1)).toBe(false);

  expect(policy.view(officer, homeToDakar, 1)).toBe(true);
  expect(policy.view(officer, dakarToBanjul, 1)).toBe(false);
  expect(policy.view(missionUser, { from_mission_id: 9, to_mission_id: 2 }, null)).toBe(
    true,
  );
  expect(policy.view(admin, homeToDakar, 1)).toBe(false);
});

test("an officer sees only the mission of their single open posting", () => {
  const policy = new MissionPolicy();

  expect(policy.view(officer, { id: 1 }, 1)).toBe(true);
  expect(policy.view(officer, { id: 8 }, 1)).toBe(false);
  expect(policy.view(officer, { id: 1 }, null)).toBe(false);
  expect(policy.view(missionUser, { id: 2 })).toBe(true);
  expect(policy.view(missionUser, { id: 1 })).toBe(false);
  expect(policy.viewAny(minister)).toBe(false);
  expect(policy.create(admin)).toBe(true);
  expect(policy.create(officer)).toBe(false);
});

test("foreign diplomatic records are created by an administrator", () => {
  const missions = new ForeignDiplomaticMissionPolicy();
  const staff = new ForeignDiplomaticStaffPolicy();

  expect(missions.create(admin)).toBe(true);
  expect(missions.create(officer)).toBe(false);
  expect(missions.view(officer)).toBe(false);
  expect(missions.export(admin)).toBe(true);
  expect(missions.export(minister)).toBe(false);
  expect(staff.create(admin)).toBe(true);
  expect(staff.create(officer)).toBe(false);
});

test("an administrator can create only a valid account assignment", () => {
  const policy = new UserPolicy();

  expect(policy.create(admin, actor(RoleSlug.ForeignServiceOfficer, 4, null))).toBe(true);
  expect(policy.create(admin, actor(RoleSlug.ForeignServiceOfficer, null, null))).toBe(
    false,
  );
  expect(policy.create(officer, actor(RoleSlug.MissionPostUser, null, 2))).toBe(false);
});

function actor(
  role: Actor["role"],
  personnelId: number | null,
  missionId: number | null,
): Actor {
  return { role, personnelId, missionId };
}
