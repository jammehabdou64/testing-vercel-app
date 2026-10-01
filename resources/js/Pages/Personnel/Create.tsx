import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PersonnelFields, type PersonnelFormData } from "./Fields";

export default function Create() {
  const form = useForm<PersonnelFormData>({
    full_name: "",
    date_of_birth: "",
    passport_number: "",
    designation: "",
    email: "",
    phone: "",
    address: "",
  });

  return (
    <AppLayout title="Personnel">
      <Head title="Add personnel" />
      <PageHeader title="Add personnel" description="Create a Foreign Service personnel record." />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/personnel");
            }}
          >
            <PersonnelFields form={form} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/personnel">Cancel</Link>
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
