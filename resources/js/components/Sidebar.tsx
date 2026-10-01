import { Link, usePage } from "@inertiajs/react";
import { Landmark } from "lucide-react";
import {
  canSee,
  directoryNavigation,
  isCurrent,
  mainNavigation,
  managementNavigation,
  type NavItem,
} from "@/navigation";
import type { SharedProps } from "@/types";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const page = usePage<SharedProps>();
  const role = page.props.auth?.user?.role;
  const personnelId = page.props.auth?.user?.personnelId;
  const appName = page.props.name ?? "Personnel";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">{appName}</p>
          <p className="text-xs text-white/70">Personnel management</p>
        </div>
      </div>
      <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        <NavGroup label="Main" items={mainNavigation} role={role} url={page.url} onNavigate={onNavigate} />
        <NavGroup
          label="Management"
          items={managementItems(role, personnelId)}
          role={role}
          url={page.url}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Directories"
          items={directoryNavigation}
          role={role}
          url={page.url}
          onNavigate={onNavigate}
        />
      </nav>
    </div>
  );
}

function managementItems(role: string | null | undefined, personnelId: number | null | undefined): NavItem[] {
  const items = managementNavigation.filter((item) => canSee(item, role));
  if (role === "foreign_service_officer" && personnelId) {
    return [
      { label: "My record", href: `/personnel/${personnelId}`, roles: [] },
      ...items,
    ];
  }

  return items;
}

function NavGroup({
  label,
  items,
  role,
  url,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  role: string | null | undefined;
  url: string;
  onNavigate?: () => void;
}) {
  const visible = items.filter((item) => canSee(item, role));
  if (visible.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </p>
      <ul className="space-y-1">
        {visible.map((item) => {
          const active = isCurrent(item.href, url);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  active ? "bg-white/15 font-medium text-white" : "text-white/80 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
