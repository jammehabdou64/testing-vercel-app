import { Head, Link } from "@inertiajs/react";
import { DataTable } from "@/components/DataTable";
import { DetailCard } from "@/components/DetailCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

type Mission = {
  id: number;
  name: string;
  country: string;
  address: string;
  email: string;
  phone: string;
};

type Staff = {
  id: number;
  full_name: string;
  designation: string;
};

export default function Index({ mission, staff }: { mission: Mission; staff: Staff[] }) {
  return (
    <AppLayout title="Foreign missions">
      <Head title={mission.name} />
      <PageHeader
        title={mission.name}
        description={mission.country}
        action={
          <div className="flex gap-2">
            <SecondaryButton asChild>
              <Link href="/foreign-missions">Back</Link>
            </SecondaryButton>
            <SecondaryButton asChild>
              <Link href={`/foreign-missions/${mission.id}/edit`}>Edit mission</Link>
            </SecondaryButton>
          </div>
        }
      />
      <DetailCard title="Mission">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Mission" value={mission.name} />
          <Fact label="Country" value={mission.country} />
          <Fact label="Address" value={mission.address} />
          <Fact label="Email" value={mission.email} />
          <Fact label="Phone" value={mission.phone} />
        </dl>
      </DetailCard>
      <PageHeader
        title="Diplomatic staff"
        action={
          <PrimaryButton asChild>
            <Link href={`/foreign-missions/${mission.id}/staff/create`}>Add staff</Link>
          </PrimaryButton>
        }
      />
      {staff.length === 0 ? (
        <EmptyState title="No staff" description="Diplomatic staff recorded for this mission appear here." />
      ) : (
        <DataTable
          rows={staff}
          columns={[
            { header: "Name", cell: (row) => <span className="font-medium">{row.full_name}</span> },
            { header: "Designation", cell: (row) => row.designation },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <span className="inline-flex gap-3">
                  <Link
                    href={`/foreign-missions/${mission.id}/staff/${row.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/foreign-missions/${mission.id}/staff/${row.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </span>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{row.full_name}</p>
                <p className="text-sm text-muted-foreground">{row.designation}</p>
                <Link
                  href={`/foreign-missions/${mission.id}/staff/${row.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View staff
                </Link>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value || "—"}</dd>
    </div>
  );
}
