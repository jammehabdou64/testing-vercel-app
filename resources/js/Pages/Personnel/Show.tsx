import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Form/Field";
import { PageHeader } from "@/components/PageHeader";
import { FileUpload } from "@/components/Form/FileUpload";
import { PhotographState } from "@/components/StatusBadge";
import { DangerButton, PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/Form/DateInput";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

type Personnel = {
  id: number;
  full_name: string;
  date_of_birth: string | null;
  passport_number: string;
  designation: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  photograph_on_file: boolean;
};

type Dependent = {
  id: number;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
};

type Posting = {
  id: number;
  mission_name: string;
  starts_on: string;
  ends_on: string | null;
};

function dateText(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return String(value).slice(0, 10);
}

export default function Show({
  personnel,
  dependents,
  postings,
}: {
  personnel: Personnel;
  dependents: Dependent[];
  postings: Posting[];
}) {
  const { auth } = usePage<SharedProps>().props;
  const isAdmin = auth?.user?.role === "administrator";
  const dependent = useForm({ full_name: "", relationship: "", date_of_birth: "" });
  const photograph = useForm<{ photograph: File | null }>({ photograph: null });
  const remove = useForm({});
  const [pendingDelete, setPendingDelete] = useState<Dependent | null>(null);

  return (
    <AppLayout title="Personnel">
      <Head title={personnel.full_name} />
      <PageHeader
        title={personnel.full_name}
        description={personnel.designation}
        action={
          <div className="flex gap-2">
            <SecondaryButton asChild>
              <Link href="/personnel">Back</Link>
            </SecondaryButton>
            {isAdmin ? (
              <PrimaryButton asChild>
                <Link href={`/personnel/${personnel.id}/edit`}>Edit</Link>
              </PrimaryButton>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <PhotographState onFile={personnel.photograph_on_file} />
          <p className="text-sm text-muted-foreground">Passport {personnel.passport_number}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Fact label="Full name" value={personnel.full_name} />
            <Fact label="Date of birth" value={dateText(personnel.date_of_birth)} />
            <Fact label="Email" value={personnel.email || "—"} />
            <Fact label="Phone" value={personnel.phone || "—"} />
            <Fact label="Address" value={personnel.address || "—"} />
            <Fact label="Designation" value={personnel.designation} />
          </dl>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Photograph</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                photograph.post(`/personnel/${personnel.id}/photograph`, { forceFormData: true });
              }}
            >
              <Field
                id="photograph"
                label="Photograph"
                hint="JPEG or PNG. Maximum size 2 MB."
                error={photograph.errors.photograph}
              >
                <FileUpload
                  id="photograph"
                  accept="image/jpeg,image/png"
                  onChange={(event) => photograph.setData("photograph", event.target.files?.[0] ?? null)}
                />
              </Field>
              <div>
                <PrimaryButton type="submit" disabled={photograph.processing || !photograph.data.photograph}>
                  {photograph.processing ? "Uploading..." : "Upload photograph"}
                </PrimaryButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dependents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dependents.length === 0 ? (
            <EmptyState title="No dependents" description="Dependents recorded for this officer appear here." />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {dependents.map((row) => (
                <li key={row.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.relationship} · {dateText(row.date_of_birth)}
                    </p>
                  </div>
                  {isAdmin ? (
                    <DangerButton type="button" size="sm" onClick={() => setPendingDelete(row)}>
                      Remove
                    </DangerButton>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {isAdmin ? (
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                dependent.post(`/personnel/${personnel.id}/dependents`, {
                  onSuccess: () => dependent.reset(),
                });
              }}
            >
              <Field id="dependent_name" label="Full name" required error={dependent.errors.full_name}>
                <Input
                  id="dependent_name"
                  value={dependent.data.full_name}
                  onChange={(event) => dependent.setData("full_name", event.target.value)}
                />
              </Field>
              <Field id="relationship" label="Relationship" required error={dependent.errors.relationship}>
                <Input
                  id="relationship"
                  value={dependent.data.relationship}
                  onChange={(event) => dependent.setData("relationship", event.target.value)}
                />
              </Field>
              <Field id="dependent_birth" label="Date of birth" error={dependent.errors.date_of_birth}>
                <DateInput
                  id="dependent_birth"
                  value={dependent.data.date_of_birth}
                  onChange={(event) => dependent.setData("date_of_birth", event.target.value)}
                />
              </Field>
              <div>
                <PrimaryButton type="submit" disabled={dependent.processing}>
                  {dependent.processing ? "Saving..." : "Add dependent"}
                </PrimaryButton>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Postings</CardTitle>
          <Link href={`/personnel/${personnel.id}/postings`} className="text-sm font-medium text-primary hover:underline">
            Open posting history
          </Link>
        </CardHeader>
        <CardContent>
          {postings.length === 0 ? (
            <EmptyState title="No postings" description="Assignment history appears here." />
          ) : (
            <ul className="divide-y divide-border">
              {postings.map((posting) => (
                <li key={posting.id} className="grid gap-1 py-3 sm:grid-cols-3">
                  <span className="font-medium">{posting.mission_name || "Mission"}</span>
                  <span className="text-sm text-muted-foreground">{posting.starts_on}</span>
                  <span className="text-sm">{posting.ends_on ?? "Current"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingDelete != null}
        title="Remove dependent"
        description={pendingDelete ? `Remove ${pendingDelete.full_name} from this record.` : ""}
        confirmLabel={remove.processing ? "Removing..." : "Remove"}
        pending={remove.processing}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }
          remove.delete(`/personnel/${personnel.id}/dependents/${pendingDelete.id}`, {
            onFinish: () => setPendingDelete(null),
          });
        }}
      />
    </AppLayout>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
