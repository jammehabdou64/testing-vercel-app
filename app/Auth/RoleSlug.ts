export const RoleSlug = {
  Administrator: "administrator",
  HonorableMinister: "honorable_minister",
  PermanentSecretary: "permanent_secretary",
  ForeignServiceOfficer: "foreign_service_officer",
  MissionPostUser: "mission_post_user",
} as const;

export type RoleSlug = (typeof RoleSlug)[keyof typeof RoleSlug];

export const roleSlugs = Object.values(RoleSlug);
