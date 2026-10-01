import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { ForeignMissionFields, type ForeignMissionForm } from "./Fields";

const empty: ForeignMissionForm = { name: "", country: "", address: "", email: "", phone: "" };

export default function Create() {
  const form = useForm<ForeignMissionForm>(empty);

  return (
    <AppLayout title="Foreign missions">
      <Head title="Add foreign mission" />
      <PageHeader title="Add foreign mission" description="This registry is separate from Gambian missions and personnel." />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/foreign-missions");
            }}
          >
            <ForeignMissionFields form={form} />
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/foreign-missions">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Saving..." : "Save"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
