import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Form/Field";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

type Posting = {
  id: number;
  mission_id: number;
  mission_name: string;
  starts_on: string;
  ends_on: string | null;
};

type MissionOption = {
  id: number;
  name: string;
};

export default function Index({
  personnel,
  missions,
  postings,
}: {
  personnel: { id: number; full_name: string };
  missions: MissionOption[];
  postings: Posting[];
}) {
  const { auth } = usePage<SharedProps>().props;
  const isAdmin = auth?.user?.role === "administrator";
  const form = useForm({ mission_id: "", starts_on: "" });

  return (
    <AppLayout title="Postings">
      <Head title={`${personnel.full_name} postings`} />
      <PageHeader
        title="Postings"
        description={personnel.full_name}
        action={
          <Button variant="outline" asChild>
            <Link href={`/personnel/${personnel.id}`}>Back to record</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {postings.length === 0 ? (
            <EmptyState title="No postings" description="Assignment history appears here." />
          ) : (
            <ul className="divide-y divide-border">
              {postings.map((posting) => (
                <li key={posting.id} className="grid gap-1 py-3 sm:grid-cols-3">
                  <span className="font-medium">{posting.mission_name || `Mission ${posting.mission_id}`}</span>
                  <span className="text-sm text-muted-foreground">{posting.starts_on}</span>
                  <span className="text-sm">{posting.ends_on ?? "Current"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign posting</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                form.post(`/personnel/${personnel.id}/postings`);
              }}
            >
              <Field id="mission_id" label="Mission" required error={form.errors.mission_id}>
                <select
                  id="mission_id"
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={form.data.mission_id}
                  onChange={(event) => form.setData("mission_id", event.target.value)}
                >
                  <option value="">Select a mission</option>
                  {missions.map((mission) => (
                    <option key={mission.id} value={mission.id}>
                      {mission.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="starts_on" label="Start date" required error={form.errors.starts_on}>
                <Input
                  id="starts_on"
                  type="date"
                  value={form.data.starts_on}
                  onChange={(event) => form.setData("starts_on", event.target.value)}
                />
              </Field>
              <div>
                <Button type="submit" disabled={form.processing}>
                  {form.processing ? "Saving..." : "Assign posting"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </AppLayout>
  );
}
