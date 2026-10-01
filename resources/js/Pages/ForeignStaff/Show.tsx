import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailCard } from "@/components/DetailCard";
import { EmptyState } from "@/components/EmptyState";
import { FileUpload } from "@/components/Form/FileUpload";
import { FormField } from "@/components/Form/Field";
import { Select } from "@/components/Form/Select";
import { PageHeader } from "@/components/PageHeader";
import { PhotographState } from "@/components/StatusBadge";
import { DangerButton, PrimaryButton, SecondaryButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";

type Mission = { id: number; name: string };

type Staff = {
  id: number;
  full_name: string;
  nationality: string;
  passport_number: string;
  photograph_on_file: boolean;
  designation: string;
  country_represented: string;
  accreditation_starts_on: string;
  accreditation_ends_on: string | null;
  email: string | null;
  phone: string | null;
};

type Dependent = {
  id: number;
  full_name: string;
  relationship: string;
};

export default function Show({
  mission,
  staff,
  dependents,
}: {
  mission: Mission;
  staff: Staff;
  dependents: Dependent[];
}) {
  const photograph = useForm<{ photograph: File | null }>({ photograph: null });
  const dependent = useForm({ full_name: "", relationship: "" });
  const remove = useForm({});
  const [pendingDelete, setPendingDelete] = useState<Dependent | null>(null);

  return (
    <AppLayout title="Foreign missions">
      <Head title={staff.full_name} />
      <PageHeader
        title={staff.full_name}
        description={`${staff.designation} · ${mission.name}`}
        action={
          <div className="flex gap-2">
            <SecondaryButton asChild>
              <Link href={`/foreign-missions/${mission.id}/staff`}>Back</Link>
            </SecondaryButton>
            <PrimaryButton asChild>
              <Link href={`/foreign-missions/${mission.id}/staff/${staff.id}/edit`}>Edit</Link>
            </PrimaryButton>
          </div>
        }
      />
      <DetailCard title="Accreditation">
        <div className="mb-4">
          <PhotographState onFile={staff.photograph_on_file} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Nationality" value={staff.nationality} />
          <Fact label="Passport" value={staff.passport_number} />
          <Fact label="Country represented" value={staff.country_represented} />
          <Fact label="Designation" value={staff.designation} />
          <Fact label="Accreditation start" value={staff.accreditation_starts_on} />
          <Fact label="Accreditation end" value={staff.accreditation_ends_on || "—"} />
          <Fact label="Email" value={staff.email || "—"} />
          <Fact label="Phone" value={staff.phone || "—"} />
        </dl>
      </DetailCard>
      <DetailCard title="Photograph">
        <form
          className="grid max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            photograph.post(`/foreign-missions/${mission.id}/staff/${staff.id}/photograph`, {
              forceFormData: true,
            });
          }}
        >
          <FormField
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
          </FormField>
          <div>
            <PrimaryButton type="submit" disabled={photograph.processing || !photograph.data.photograph}>
              {photograph.processing ? "Uploading..." : "Upload photograph"}
            </PrimaryButton>
          </div>
        </form>
      </DetailCard>
      <DetailCard title="Dependents">
        <div className="space-y-4">
          {dependents.length === 0 ? (
            <EmptyState title="No dependents" description="Spouse and children recorded for this staff member appear here." />
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {dependents.map((row) => (
                <li key={row.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-sm capitalize text-muted-foreground">{row.relationship}</p>
                  </div>
                  <DangerButton type="button" size="sm" onClick={() => setPendingDelete(row)}>
                    Remove
                  </DangerButton>
                </li>
              ))}
            </ul>
          )}
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              dependent.post(`/foreign-missions/${mission.id}/staff/${staff.id}/dependents`, {
                onSuccess: () => dependent.reset(),
              });
            }}
          >
            <FormField id="dependent_name" label="Full name" required error={dependent.errors.full_name}>
              <Input
                id="dependent_name"
                value={dependent.data.full_name}
                onChange={(event) => dependent.setData("full_name", event.target.value)}
              />
            </FormField>
            <FormField id="relationship" label="Relationship" required error={dependent.errors.relationship}>
              <Select
                id="relationship"
                value={dependent.data.relationship}
                onChange={(event) => dependent.setData("relationship", event.target.value)}
              >
                <option value="">Select a relationship</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
              </Select>
            </FormField>
            <div>
              <PrimaryButton type="submit" disabled={dependent.processing}>
                {dependent.processing ? "Saving..." : "Add dependent"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </DetailCard>
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
          remove.delete(`/foreign-missions/${mission.id}/staff/${staff.id}/dependents/${pendingDelete.id}`, {
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
