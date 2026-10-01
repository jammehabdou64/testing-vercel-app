import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { PrimaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

type Letter = {
  id: number;
  from_mission_id: number;
  to_mission_id: number;
  from_mission_name: string;
  to_mission_name: string;
  composed_on: string;
};

export default function Index({ correspondence }: { correspondence: Letter[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return correspondence;
    }

    return correspondence.filter((letter) =>
      [letter.from_mission_name, letter.to_mission_name, letter.composed_on].some((value) =>
        String(value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [correspondence, query]);

  return (
    <AppLayout title="Correspondence">
      <Head title="Correspondence" />
      <PageHeader
        title="Correspondence"
        description="Letters sent or received by your mission."
        action={
          <PrimaryButton asChild>
            <Link href="/correspondence/create">Compose</Link>
          </PrimaryButton>
        }
      />
      <SearchInput
        value={query}
        placeholder="Filter the loaded letters"
        aria-label="Filter correspondence"
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No correspondence"
          description={
            query.trim() !== "" && correspondence.length > 0
              ? "Nothing matches this filter."
              : "Letters for your mission appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: "From", cell: (row) => row.from_mission_name || "Mission" },
            { header: "To", cell: (row) => row.to_mission_name || "Mission" },
            { header: "Date", cell: (row) => row.composed_on },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <a
                  href={`/correspondence/${row.id}/pdf`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Download PDF
                </a>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{row.from_mission_name || "Mission"}</p>
                <p className="text-sm text-muted-foreground">To {row.to_mission_name || "Mission"}</p>
                <p className="text-sm">{row.composed_on}</p>
                <a
                  href={`/correspondence/${row.id}/pdf`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Download PDF
                </a>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
