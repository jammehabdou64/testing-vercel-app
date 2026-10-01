import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { ForeignMissionFields, type ForeignMissionForm } from "./Fields";

type Mission = ForeignMissionForm & { id: number };

export default function Edit({ mission }: { mission: Mission }) {
  const form = useForm<ForeignMissionForm>({
    name: mission.name ?? "",
    country: mission.country ?? "",
    address: mission.address ?? "",
    email: mission.email ?? "",
    phone: mission.phone ?? "",
  });

  return (
    <AppLayout title="Foreign missions">
      <Head title={`Edit ${mission.name}`} />
      <PageHeader title="Edit foreign mission" description={mission.country} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.put(`/foreign-missions/${mission.id}`);
            }}
          >
            <ForeignMissionFields form={form} />
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href={`/foreign-missions/${mission.id}/staff`}>Cancel</Link>
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
