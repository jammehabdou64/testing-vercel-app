import { Head, Link, useForm } from "@inertiajs/react";
import { FormField } from "@/components/Form/Field";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";

type Mission = {
  id: number;
  name: string;
  is_home: boolean;
};

export default function Edit({ mission }: { mission: Mission }) {
  const form = useForm({ name: mission.name ?? "" });

  return (
    <AppLayout title="Missions">
      <Head title={`Edit ${mission.name}`} />
      <PageHeader
        title="Edit mission"
        description={mission.is_home ? "This is the Home mission." : mission.name}
      />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.put(`/missions/${mission.id}`);
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
