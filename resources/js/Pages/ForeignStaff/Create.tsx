import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { optionalStaffFields, StaffFields, type StaffForm } from "./Fields";

const empty: StaffForm = {
  full_name: "",
  nationality: "",
  passport_number: "",
  designation: "",
  country_represented: "",
  accreditation_starts_on: "",
  accreditation_ends_on: "",
  email: "",
  phone: "",
};

export default function Create({ mission }: { mission: { id: number; name: string } }) {
  const form = useForm<StaffForm>(empty);

  return (
    <AppLayout title="Foreign missions">
      <Head title="Add diplomatic staff" />
      <PageHeader title="Add diplomatic staff" description={mission.name} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.transform(optionalStaffFields);
              form.post(`/foreign-missions/${mission.id}/staff`);
            }}
          >
            <StaffFields form={form} />
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
