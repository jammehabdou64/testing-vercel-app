import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { PrimaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

type Mission = {
  id: number;
  name: string;
  is_home: boolean;
};

export default function Index({ missions }: { missions: Mission[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return missions;
    }

    return missions.filter((mission) => mission.name.toLowerCase().includes(needle));
  }, [missions, query]);

  return (
    <AppLayout title="Missions">
      <Head title="Missions" />
      <PageHeader
        title="Missions"
        description="Gambian missions and posts."
        action={
          <PrimaryButton asChild>
            <Link href="/missions/create">Add mission</Link>
          </PrimaryButton>
        }
      />
      <SearchInput
        value={query}
        placeholder="Filter the loaded missions"
        aria-label="Filter missions"
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No missions"
          description={
            query.trim() !== "" && missions.length > 0
              ? "Nothing matches this filter."
              : "Gambian missions and posts appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            {
              header: "Mission name",
              cell: (row) => (
                <span className="inline-flex items-center gap-2 font-medium">
                  {row.name}
                  {row.is_home ? (
                    <span className="rounded-full bg-[#F2F4F7] px-2 py-0.5 text-xs font-medium text-[#344054]">
                      Home
                    </span>
                  ) : null}
                </span>
              ),
            },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <Link href={`/missions/${row.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                  Edit
                </Link>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{row.name}</p>
                {row.is_home ? <p className="text-sm text-muted-foreground">Home</p> : null}
                <Link href={`/missions/${row.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                  Edit mission
                </Link>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
