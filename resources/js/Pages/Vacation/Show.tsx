import { Head, Link } from "@inertiajs/react";
import { DetailCard } from "@/components/DetailCard";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryButton } from "@/components/ui/button";
import AppLayout from "@/Layouts/AppLayout";

type Notice = {
  id: number;
  officer_name: string;
  travelling_country: string;
  reason: string;
  submitted_on: string;
};

export default function Show({ notification }: { notification: Notice }) {
  return (
    <AppLayout title="Vacation">
      <Head title="Vacation notification" />
      <PageHeader
        title={notification.officer_name || "Vacation notification"}
        description={notification.travelling_country}
        action={
          <SecondaryButton asChild>
            <Link href="/vacation-notifications">Back</Link>
          </SecondaryButton>
        }
      />
      <DetailCard title="Notification">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Officer</dt>
            <dd className="mt-1">{notification.officer_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Travelling country</dt>
            <dd className="mt-1">{notification.travelling_country}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Submitted on</dt>
            <dd className="mt-1">{notification.submitted_on}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Reason</dt>
            <dd className="mt-1 whitespace-pre-wrap">{notification.reason}</dd>
          </div>
        </dl>
      </DetailCard>
    </AppLayout>
  );
}
