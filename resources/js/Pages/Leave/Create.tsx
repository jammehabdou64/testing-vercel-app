import { Head, Link, useForm } from "@inertiajs/react";
import { DateInput } from "@/components/Form/DateInput";
import { FormField } from "@/components/Form/Field";
import { Select } from "@/components/Form/Select";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

export default function Create({ personnelId }: { personnelId: number }) {
  const form = useForm({
    personnel_id: String(personnelId),
    leave_type: "",
    starts_on: "",
    ends_on: "",
  });

  return (
    <AppLayout title="Leave">
      <Head title="Apply for leave" />
      <PageHeader
        title="Apply for leave"
        description="The application is filed for the personnel record on this account."
      />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/leave");
            }}
          >
            <FormField id="leave_type" label="Leave type" required error={form.errors.leave_type}>
              <Select
                id="leave_type"
                value={form.data.leave_type}
                onChange={(event) => form.setData("leave_type", event.target.value)}
              >
                <option value="">Select a type</option>
                <option value="annual">Annual</option>
                <option value="casual">Casual</option>
              </Select>
            </FormField>
            <FormField id="starts_on" label="Start date" required error={form.errors.starts_on}>
              <DateInput
                id="starts_on"
                value={form.data.starts_on}
                onChange={(event) => form.setData("starts_on", event.target.value)}
              />
            </FormField>
            <FormField id="ends_on" label="End date" required error={form.errors.ends_on}>
              <DateInput
                id="ends_on"
                value={form.data.ends_on}
                onChange={(event) => form.setData("ends_on", event.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/leave">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Submitting..." : "Submit leave"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
