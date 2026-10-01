import { Link, useForm } from "@inertiajs/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/types";

const roleLabels: Record<string, string> = {
  administrator: "Administrator",
  honorable_minister: "Honorable Minister",
  permanent_secretary: "Permanent Secretary",
  foreign_service_officer: "Foreign Service Officer",
  mission_post_user: "Mission / Post User",
};

export function Header({
  title,
  user,
  menuOpen,
  onOpenMenu,
}: {
  title: string;
  user: AuthUser;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const logout = useForm({});
  const role = user?.role ? roleLabels[user.role] ?? user.role : null;

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-controls="app-navigation"
          onClick={onOpenMenu}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <span className="block font-medium">{user?.name ?? "Account"}</span>
          {role ? <span className="block text-xs text-muted-foreground">{role}</span> : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              logout.post("/logout");
            }}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
