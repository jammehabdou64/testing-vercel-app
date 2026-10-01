import { Head, Link, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { PrimaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

type Notice = {
  id: number;
  officer_name: string;
  travelling_country: string;
  reason: string;
  submitted_on: string;
};

export default function Index({ notifications }: { notifications: Notice[] }) {
  const { auth } = usePage<SharedProps>().props;
  const canFile = auth?.user?.role === "foreign_service_officer";
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return notifications;
    }

    return notifications.filter((notice) =>
      [notice.officer_name, notice.travelling_country, notice.reason, notice.submitted_on].some((value) =>
        String(value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [notifications, query]);

  return (
    <AppLayout title="Vacation">
      <Head title="Vacation notifications" />
      <PageHeader
        title="Vacation notifications"
        description={
          canFile
            ? "Notices filed from this account."
            : "Notices filed by Foreign Service Officers."
        }
        action={
          canFile ? (
            <PrimaryButton asChild>
              <Link href="/vacation-notifications/create">File notification</Link>
            </PrimaryButton>
          ) : null
        }
      />
      <SearchInput
        value={query}
        placeholder="Filter the loaded notices"
        aria-label="Filter vacation notifications"
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={
            query.trim() !== "" && notifications.length > 0
              ? "Nothing matches this filter."
              : "Notices you may view appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: "Officer", cell: (row) => row.officer_name || "Officer" },
            { header: "Country", cell: (row) => row.travelling_country },
            { header: "Reason", cell: (row) => row.reason },
            { header: "Date", cell: (row) => row.submitted_on },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <Link
                  href={`/vacation-notifications/${row.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View
                </Link>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{row.officer_name || "Officer"}</p>
                <p className="text-sm">{row.travelling_country}</p>
                <p className="text-sm text-muted-foreground">{row.reason}</p>
                <p className="text-sm">{row.submitted_on}</p>
                <Link
                  href={`/vacation-notifications/${row.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View notification
                </Link>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
