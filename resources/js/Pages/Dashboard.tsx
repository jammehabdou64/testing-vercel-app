import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import type { SharedProps } from "../types";

export default function Dashboard() {
  const { auth, flash } = usePage<SharedProps>().props;
  const status = flash?.type === "status" ? flash.message : "";

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />
      {status ? <p className="kit-status">{status}</p> : null}
      <div className="kit-card kit-wide">
        <h1 className="kit-title">Dashboard</h1>
        <p className="kit-muted mt-3">You're logged in{auth?.user?.name ? ` as ${auth.user.name}` : ""}.</p>
      </div>
    </AuthenticatedLayout>
  );
}
