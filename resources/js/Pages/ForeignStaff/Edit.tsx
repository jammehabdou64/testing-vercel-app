import { Head, Link, useForm } from "@inertiajs/react";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";
import { optionalStaffFields, StaffFields, type StaffForm } from "./Fields";

type Staff = StaffForm & { id: number; foreign_diplomatic_mission_id: number };

export default function Edit({ mission, staff }: { mission: { id: number; name: string }; staff: Staff }) {
  const form = useForm<StaffForm>({
    full_name: staff.full_name ?? "",
    nationality: staff.nationality ?? "",
    passport_number: staff.passport_number ?? "",
    designation: staff.designation ?? "",
    country_represented: staff.country_represented ?? "",
    accreditation_starts_on: String(staff.accreditation_starts_on ?? "").slice(0, 10),
    accreditation_ends_on: String(staff.accreditation_ends_on ?? "").slice(0, 10),
    email: staff.email ?? "",
    phone: staff.phone ?? "",
  });

  return (
    <AppLayout title="Foreign missions">
      <Head title={`Edit ${staff.full_name}`} />
      <PageHeader title="Edit diplomatic staff" description={mission.name} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.transform(optionalStaffFields);
              form.put(`/foreign-missions/${mission.id}/staff/${staff.id}`);
            }}
          >
            <StaffFields form={form} />
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href={`/foreign-missions/${mission.id}/staff/${staff.id}`}>Cancel</Link>
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
