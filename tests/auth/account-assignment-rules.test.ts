import { expect, test } from "bun:test";
import { AccountAssignmentRules } from "../../app/Auth/AccountAssignmentRules";
import type { Actor } from "../../app/Auth/Actor";
import { RoleSlug, roleSlugs } from "../../app/Auth/RoleSlug";

test("role slugs are the five logins and no diplomatic staff role", () => {
  expect(roleSlugs).toEqual([
    "administrator",
    "honorable_minister",
    "permanent_secretary",
    "foreign_service_officer",
    "mission_post_user",
  ]);
});

test("account links follow the role and are not inferred from personnel", () => {
  expect(AccountAssignmentRules.allows(actor(RoleSlug.ForeignServiceOfficer, 4, null))).toBe(
    true,
  );
  expect(AccountAssignmentRules.allows(actor(RoleSlug.ForeignServiceOfficer, null, null))).toBe(
    false,
  );
  expect(AccountAssignmentRules.allows(actor(RoleSlug.ForeignServiceOfficer, 4, 1))).toBe(
    false,
  );

  expect(AccountAssignmentRules.allows(actor(RoleSlug.MissionPostUser, null, 2))).toBe(true);
  expect(AccountAssignmentRules.allows(actor(RoleSlug.MissionPostUser, null, null))).toBe(
    false,
  );
  expect(AccountAssignmentRules.allows(actor(RoleSlug.MissionPostUser, 4, 2))).toBe(false);

  for (const role of [
    RoleSlug.Administrator,
    RoleSlug.HonorableMinister,
    RoleSlug.PermanentSecretary,
  ]) {
    expect(AccountAssignmentRules.allows(actor(role, null, null))).toBe(true);
    expect(AccountAssignmentRules.allows(actor(role, 4, null))).toBe(true);
    expect(AccountAssignmentRules.allows(actor(role, null, 2))).toBe(false);
  }
});

function actor(
  role: Actor["role"],
  personnelId: number | null,
  missionId: number | null,
): Actor {
  return { role, personnelId, missionId };
}
