import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { PrimaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

type Account = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  role_name: string | null;
};

export default function Index({ accounts }: { accounts: Account[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return accounts;
    }

    return accounts.filter((account) =>
      [account.name, account.email, account.role_name, account.role].some((value) =>
        String(value ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [accounts, query]);

  return (
    <AppLayout title="Accounts">
      <Head title="Accounts" />
      <PageHeader
        title="Accounts"
        description="User accounts and the role each one holds."
        action={
          <PrimaryButton asChild>
            <Link href="/accounts/create">Create account</Link>
          </PrimaryButton>
        }
      />
      <SearchInput
        value={query}
        placeholder="Filter the loaded accounts"
        aria-label="Filter accounts"
        onChange={(event) => setQuery(event.target.value)}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No accounts"
          description={
            query.trim() !== "" && accounts.length > 0
              ? "Nothing matches this filter."
              : "User accounts appear here."
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={[
            { header: "Name", cell: (row) => <span className="font-medium">{row.name}</span> },
            { header: "Email", cell: (row) => row.email },
            { header: "Role", cell: (row) => row.role_name || "—" },
            {
              header: "",
              className: "text-right",
              cell: (row) => (
                <Link href={`/accounts/${row.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                  Edit
                </Link>
              ),
            },
          ]}
          card={(row) => (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
                <p className="text-sm">{row.role_name || "—"}</p>
                <Link href={`/accounts/${row.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                  Edit account
                </Link>
              </CardContent>
            </Card>
          )}
        />
      )}
    </AppLayout>
  );
}
