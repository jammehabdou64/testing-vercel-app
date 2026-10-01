import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DangerButton, PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

type Application = {
  id: number;
  personnel_id: number;
  officer_name: string;
  leave_type: string;
  starts_on: string;
  ends_on: string;
  status: string;
  due_back: string | null;
};

const typeLabels: Record<string, string> = {
  annual: "Annual",
  casual: "Casual",
};

export default function Index({ applications }: { applications: Application[] }) {
  const { auth } = usePage<SharedProps>().props;
  const role = auth?.user?.role;
  const canApply = role === "foreign_service_officer" && auth?.user?.personnelId != null;
  const canDecide = role === "permanent_secretary";
  const decision = useForm({});
  const [pending, setPending] = useState<{ id: number; action: "approve" | "reject" } | null>(null);

  return (
    <AppLayout title="Leave">
      <Head title="Leave" />
      <PageHeader
        title={canApply ? "My leave" : "Leave applications"}
        description={
          canDecide
            ? "Pending applications can be approved or rejected."
            : "Leave decisions stay with the Permanent Secretary."
        }
        action={
          canApply ? (
            <PrimaryButton asChild>
              <Link href="/leave/create">Apply for leave</Link>
            </PrimaryButton>
          ) : null
        }
      />
      {applications.length === 0 ? (
        <EmptyState title="No leave applications" description="Applications that you may view appear here." />
      ) : (
        <DataTable
          rows={applications}
          columns={[
            { header: "Officer", cell: (row) => row.officer_name || "Officer" },
            { header: "Type", cell: (row) => typeLabels[row.leave_type] ?? row.leave_type },
            { header: "Dates", cell: (row) => `${row.starts_on} → ${row.ends_on}` },
            { header: "Due back", cell: (row) => row.due_back ?? "—" },
            { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
            {
              header: "",
              className: "text-right",
              cell: (row) =>
                canDecide && row.status === "pending" ? (
                  <DecisionButtons
                    onApprove={() => setPending({ id: row.id, action: "approve" })}
                    onReject={() => setPending({ id: row.id, action: "reject" })}
                  />
                ) : null,
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{typeLabels[row.leave_type] ?? row.leave_type}</p>
                    <p className="text-sm text-muted-foreground">{row.officer_name}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <p className="text-sm">
                  {row.starts_on} → {row.ends_on}
                </p>
                {row.due_back ? <p className="text-sm">Due back: {row.due_back}</p> : null}
                {canDecide && row.status === "pending" ? (
                  <DecisionButtons
                    onApprove={() => setPending({ id: row.id, action: "approve" })}
                    onReject={() => setPending({ id: row.id, action: "reject" })}
                  />
                ) : null}
              </CardContent>
            </Card>
          )}
        />
      )}
      <ConfirmDialog
        open={pending != null}
        title={pending?.action === "reject" ? "Reject leave" : "Approve leave"}
        description="This records the decision for the application."
        confirmLabel={decision.processing ? "Saving..." : pending?.action === "reject" ? "Reject" : "Approve"}
        pending={decision.processing}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) {
            return;
          }
          decision.post(`/leave/${pending.id}/${pending.action}`, {
            onFinish: () => setPending(null),
          });
        }}
      />
    </AppLayout>
  );
}

function DecisionButtons({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <SecondaryButton type="button" size="sm" onClick={onApprove}>
        Approve
      </SecondaryButton>
      <DangerButton type="button" size="sm" onClick={onReject}>
        Reject
      </DangerButton>
    </div>
  );
}
