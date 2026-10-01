import { RoleSlug } from "../../app/Auth/RoleSlug";

export type NavItem = {
  label: string;
  href: string;
  roles: readonly string[];
};

export const mainNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: [] },
];

export const managementNavigation: NavItem[] = [
  { label: "Accounts", href: "/accounts", roles: [RoleSlug.Administrator] },
  { label: "Personnel", href: "/personnel", roles: [RoleSlug.Administrator] },
  { label: "Missions", href: "/missions", roles: [RoleSlug.Administrator] },
  {
    label: "Leave",
    href: "/leave",
    roles: [
      RoleSlug.HonorableMinister,
      RoleSlug.PermanentSecretary,
      RoleSlug.ForeignServiceOfficer,
    ],
  },
  {
    label: "Vacation",
    href: "/vacation-notifications",
    roles: [RoleSlug.Administrator, RoleSlug.ForeignServiceOfficer],
  },
  {
    label: "Correspondence",
    href: "/correspondence",
    roles: [RoleSlug.ForeignServiceOfficer, RoleSlug.MissionPostUser],
  },
];

export const directoryNavigation: NavItem[] = [
  { label: "Foreign missions", href: "/foreign-missions", roles: [RoleSlug.Administrator] },
];

export function canSee(item: NavItem, role: string | null | undefined): boolean {
  if (item.roles.length === 0) {
    return true;
  }

  return role != null && item.roles.includes(role);
}

export function isCurrent(href: string, url: string): boolean {
  const path = url.split("?")[0] ?? url;
  if (href === "/dashboard") {
    return path === "/dashboard";
  }

  return path === href || path.startsWith(`${href}/`);
}
