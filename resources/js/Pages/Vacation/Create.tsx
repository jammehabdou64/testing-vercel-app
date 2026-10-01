import { Head, Link, useForm } from "@inertiajs/react";
import { DateInput } from "@/components/Form/DateInput";
import { FormField } from "@/components/Form/Field";
import { Textarea } from "@/components/Form/Textarea";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";

export default function Create() {
  const form = useForm({
    travelling_country: "",
    reason: "",
    submitted_on: "",
  });

  return (
    <AppLayout title="Vacation">
      <Head title="File vacation notification" />
      <PageHeader
        title="File vacation notification"
        description="The notice is filed for the personnel record on this account."
      />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/vacation-notifications");
            }}
          >
            <FormField
              id="travelling_country"
              label="Travelling country"
              required
              error={form.errors.travelling_country}
            >
              <Input
                id="travelling_country"
                value={form.data.travelling_country}
                onChange={(event) => form.setData("travelling_country", event.target.value)}
              />
            </FormField>
            <FormField id="reason" label="Reason" required error={form.errors.reason}>
              <Textarea
                id="reason"
                value={form.data.reason}
                onChange={(event) => form.setData("reason", event.target.value)}
              />
            </FormField>
            <FormField id="submitted_on" label="Submitted on" required error={form.errors.submitted_on}>
              <DateInput
                id="submitted_on"
                value={form.data.submitted_on}
                onChange={(event) => form.setData("submitted_on", event.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/vacation-notifications">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Submitting..." : "Submit"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
