import { Head, Link, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { SearchInput } from "@/components/SearchInput";
import { PhotographState } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

type Row = {
  id: number;
  full_name: string;
  designation: string;
  passport_number: string;
  photograph_on_file: boolean;
};

export default function Index({ personnel }: { personnel: Row[] }) {
  const { auth } = usePage<SharedProps>().props;
  const isAdmin = auth?.user?.role === "administrator";
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return personnel;
    }

    return personnel.filter((row) =>
      [row.full_name, row.designation, row.passport_number].some((value) =>
        String(value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [personnel, query]);

  return (
    <AppLayout title="Personnel">
      <Head title="Personnel" />
      <PageHeader
        title="Personnel"
        description="Foreign Service personnel records."
        action={
          isAdmin ? (
            <PrimaryButton asChild>
              <Link href="/personnel/create">Add personnel</Link>
            </PrimaryButton>
          ) : null
        }
      />
      <SearchInput
        value={query}
        placeholder="Filter the loaded register"
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Filter personnel"
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No personnel"
          description={
            query.trim() !== "" && personnel.length > 0
              ? "Nothing matches this filter."
              : "Personnel records appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            {
              header: "Photo",
              cell: (row) => <PhotographState onFile={row.photograph_on_file} />,
            },
            { header: "Name", cell: (row) => <span className="font-medium">{row.full_name}</span> },
            { header: "Designation", cell: (row) => row.designation },
            { header: "Passport", cell: (row) => row.passport_number },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <Link href={`/personnel/${row.id}`} className="text-sm font-medium text-primary hover:underline">
                  View
                </Link>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div>
                  <p className="font-medium">{row.full_name}</p>
                  <p className="text-sm text-muted-foreground">{row.designation}</p>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Passport</span>
                  <span className="mt-1 block">{row.passport_number}</span>
                </p>
                <Link href={`/personnel/${row.id}`} className="text-sm font-medium text-primary hover:underline">
                  View personnel
                </Link>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
