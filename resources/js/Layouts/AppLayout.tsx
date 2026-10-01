import { usePage } from "@inertiajs/react";
import { useState, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { SharedProps } from "@/types";

export default function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const { auth, flash } = usePage<SharedProps>().props;
  const [open, setOpen] = useState(false);
  const message = flash?.message;

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent id="app-navigation" aria-describedby={undefined}>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0">
        <Header title={title} user={auth?.user ?? null} menuOpen={open} onOpenMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8">
          {message ? (
            <p
              role="status"
              className={
                flash?.type === "status"
                  ? "rounded-md border border-success/30 bg-[#ecfdf3] px-4 py-3 text-sm text-[#166534]"
                  : "rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground"
              }
            >
              {message}
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
