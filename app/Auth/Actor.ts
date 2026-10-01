import type { RoleSlug } from "./RoleSlug";

/**
 * The signed-in account. Role is stored on the user, not inferred from a
 * personnel or mission row.
 */
export type Actor = {
  role: RoleSlug;
  personnelId: number | null;
  missionId: number | null;
};

export function columnId(record: object, column: string): number | null {
  const bag = record as Record<string, unknown> & {
    getAttribute?: (key: string) => unknown;
  };
  const raw =
    typeof bag.getAttribute === "function" ? bag.getAttribute(column) : bag[column];

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === "bigint") {
    return Number(raw);
  }

  return null;
}
