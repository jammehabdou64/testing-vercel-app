import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonnelFields, type PersonnelFormData } from "./Fields";

type Personnel = PersonnelFormData & { id: number };

export default function Edit({ personnel }: { personnel: Personnel }) {
  const form = useForm<PersonnelFormData>({
    full_name: personnel.full_name ?? "",
    date_of_birth: String(personnel.date_of_birth ?? "").slice(0, 10),
    passport_number: personnel.passport_number ?? "",
    designation: personnel.designation ?? "",
    email: personnel.email ?? "",
    phone: personnel.phone ?? "",
    address: personnel.address ?? "",
  });

  return (
    <AppLayout title="Personnel">
      <Head title={`Edit ${personnel.full_name}`} />
      <PageHeader title="Edit personnel" description={personnel.full_name} />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.put(`/personnel/${personnel.id}`);
            }}
          >
            <PersonnelFields form={form} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href={`/personnel/${personnel.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={form.processing}>
                {form.processing ? "Saving..." : "Save personnel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
