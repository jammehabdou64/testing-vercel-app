import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { AccountFields, postedAccount, type AccountFormData, type AssignmentChoices } from "./Fields";

export default function Create(choices: AssignmentChoices) {
  const form = useForm<AccountFormData>({
    name: "",
    email: "",
    password: "",
    role: "",
    personnel_id: "",
    mission_id: "",
  });

  return (
    <AppLayout title="Accounts">
      <Head title="Create account" />
      <PageHeader title="Create account" description="The server checks the role and its required link." />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.transform((data) => postedAccount(data, true));
              form.post("/accounts");
            }}
          >
            <AccountFields form={form} choices={choices} includePassword />
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/accounts">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Saving..." : "Create account"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
