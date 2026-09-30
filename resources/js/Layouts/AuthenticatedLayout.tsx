import { Link, useForm, usePage } from "@inertiajs/react";
import type { ReactNode } from "react";
import type { SharedProps } from "../types";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { auth, name } = usePage<SharedProps>().props;
  const logout = useForm({});

  return (
    <div className="kit">
      <header className="kit-nav">
        <Link href="/dashboard" className="font-serif text-2xl">
          {name ?? "Javel"}
        </Link>
        <nav>
          <Link href="/dashboard" className="kit-link">
            Dashboard
          </Link>
          <Link href="/profile" className="kit-link">
            Profile
          </Link>
          <button type="button" className="kit-link" onClick={() => logout.post("/logout")}>
            Log out
          </button>
        </nav>
      </header>
      <main className="kit-main">{children}</main>
      <p className="sr-only">{auth?.user?.email}</p>
    </div>
  );
}
