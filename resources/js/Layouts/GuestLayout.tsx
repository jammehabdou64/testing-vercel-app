import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kit">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-6 font-serif text-4xl tracking-tight">
          Javel
        </Link>
        <div className="kit-card">{children}</div>
      </div>
    </div>
  );
}
