import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";

type Mission = {
  id: number;
  name: string;
  country: string;
};

export default function Index({ missions }: { missions: Mission[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [missionName, setMissionName] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return missions;
    }

    return missions.filter((mission) =>
      [mission.name, mission.country].some((value) => String(value ?? "").toLowerCase().includes(needle)),
    );
  }, [missions, query]);

  const exportParams = new URLSearchParams();
  if (country.trim() !== "") {
    exportParams.set("country", country.trim());
  }
  if (missionName.trim() !== "") {
    exportParams.set("mission_name", missionName.trim());
  }
  const exportHref = `/foreign-missions/export${exportParams.size > 0 ? `?${exportParams.toString()}` : ""}`;

  return (
    <AppLayout title="Foreign missions">
      <Head title="Foreign missions" />
      <PageHeader
        title="Foreign missions"
        description="Diplomatic missions accredited in The Gambia."
        action={
          <PrimaryButton asChild>
            <Link href="/foreign-missions/create">Add mission</Link>
          </PrimaryButton>
        }
      />
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="grid gap-1.5 text-sm">
            Country
            <Input value={country} onChange={(event) => setCountry(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            Mission name
            <Input value={missionName} onChange={(event) => setMissionName(event.target.value)} />
          </label>
          <SecondaryButton asChild>
            <a href={exportHref}>Export directory</a>
          </SecondaryButton>
        </CardContent>
      </Card>
      <SearchInput
        value={query}
        placeholder="Filter the loaded missions"
        aria-label="Filter foreign missions"
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No foreign missions"
          description={
            query.trim() !== "" && missions.length > 0
              ? "Nothing matches this filter."
              : "Diplomatic missions accredited in The Gambia appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: "Mission", cell: (row) => <span className="font-medium">{row.name}</span> },
            { header: "Country", cell: (row) => row.country },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <span className="inline-flex gap-3">
                  <Link
                    href={`/foreign-missions/${row.id}/staff`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/foreign-missions/${row.id}/edit`}
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
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.country}</p>
                <div className="flex gap-3">
                  <Link
                    href={`/foreign-missions/${row.id}/staff`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View mission
                  </Link>
                  <Link
                    href={`/foreign-missions/${row.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
