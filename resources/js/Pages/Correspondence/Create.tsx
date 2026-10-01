import { Head, Link, useForm } from "@inertiajs/react";
import { DateInput } from "@/components/Form/DateInput";
import { FormField } from "@/components/Form/Field";
import { Select } from "@/components/Form/Select";
import { Textarea } from "@/components/Form/Textarea";
import { PageHeader } from "@/components/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/Layouts/AppLayout";

type MissionOption = {
  id: number;
  name: string;
};

export default function Create({ missions }: { missions: MissionOption[] }) {
  const form = useForm({
    to_mission_id: "",
    composed_on: "",
    body: "",
  });

  return (
    <AppLayout title="Correspondence">
      <Head title="Compose correspondence" />
      <PageHeader
        title="Compose correspondence"
        description="The sending mission is taken from this account."
      />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid max-w-xl gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              form.post("/correspondence");
            }}
          >
            <FormField id="to_mission_id" label="To" required error={form.errors.to_mission_id}>
              <Select
                id="to_mission_id"
                value={form.data.to_mission_id}
                onChange={(event) => form.setData("to_mission_id", event.target.value)}
              >
                <option value="">Select a mission</option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="composed_on" label="Date" required error={form.errors.composed_on}>
              <DateInput
                id="composed_on"
                value={form.data.composed_on}
                onChange={(event) => form.setData("composed_on", event.target.value)}
              />
            </FormField>
            <FormField id="body" label="Letter" required error={form.errors.body}>
              <Textarea
                id="body"
                value={form.data.body}
                onChange={(event) => form.setData("body", event.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <SecondaryButton asChild>
                <Link href="/correspondence">Cancel</Link>
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={form.processing}>
                {form.processing ? "Sending..." : "Send"}
              </PrimaryButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
