import { Head, Link, useForm } from "@inertiajs/react";
import { FormField } from "@/components/Form/Field";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";

export default function Create() {
  const form = useForm({ name: "" });

  return (
    <AppLayout title="Missions">
      <Head title="Add mission" />
      <PageHeader title="Add mission" description="Create a Gambian mission or post." />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/missions");
            }}
          >
            <FormField id="name" label="Name" required error={form.errors.name}>
              <Input id="name" value={form.data.name} onChange={(event) => form.setData("name", event.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/missions">Cancel</Link>
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
