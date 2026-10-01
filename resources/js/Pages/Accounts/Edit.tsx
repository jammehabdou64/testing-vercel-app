import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { AccountFields, postedAccount, type AccountFormData, type AssignmentChoices } from "./Fields";

type Account = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  personnel_id: number | null;
  mission_id: number | null;
};

export default function Edit({ account, ...choices }: { account: Account } & AssignmentChoices) {
  const form = useForm<AccountFormData>({
    name: account.name ?? "",
    email: account.email ?? "",
    password: "",
    role: account.role ?? "",
    personnel_id: account.personnel_id == null ? "" : String(account.personnel_id),
    mission_id: account.mission_id == null ? "" : String(account.mission_id),
  });

  return (
    <AppLayout title="Accounts">
      <Head title={`Edit ${account.name}`} />
      <PageHeader title="Edit account" description={account.email} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.transform((data) => postedAccount(data, false));
              form.put(`/accounts/${account.id}`);
            }}
          >
            <AccountFields form={form} choices={choices} includePassword={false} />
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/accounts">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Saving..." : "Save account"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
