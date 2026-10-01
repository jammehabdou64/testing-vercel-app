import { DateInput } from "@/components/Form/DateInput";
import { FormField } from "@/components/Form/Field";
import { Input } from "@/components/ui/input";

export type StaffForm = {
  full_name: string;
  nationality: string;
  passport_number: string;
  designation: string;
  country_represented: string;
  accreditation_starts_on: string;
  accreditation_ends_on?: string;
  email?: string;
  phone?: string;
};

type Binding = {
  data: StaffForm;
  errors: Partial<Record<keyof StaffForm, string>>;
  setData: <K extends keyof StaffForm>(key: K, value: StaffForm[K]) => void;
};

export function optionalStaffFields(data: StaffForm): StaffForm {
  const next = { ...data };
  if ((next.accreditation_ends_on ?? "").trim() === "") {
    delete next.accreditation_ends_on;
  }
  if ((next.email ?? "").trim() === "") {
    delete next.email;
  }
  if ((next.phone ?? "").trim() === "") {
    delete next.phone;
  }
  return next;
}

export function StaffFields({ form }: { form: Binding }) {
  return (
    <div className="grid gap-4">
      <FormField id="full_name" label="Full name" required error={form.errors.full_name}>
        <Input id="full_name" value={form.data.full_name} onChange={(event) => form.setData("full_name", event.target.value)} />
      </FormField>
      <FormField id="nationality" label="Nationality" required error={form.errors.nationality}>
        <Input id="nationality" value={form.data.nationality} onChange={(event) => form.setData("nationality", event.target.value)} />
      </FormField>
      <FormField id="passport_number" label="Passport number" required error={form.errors.passport_number}>
        <Input
          id="passport_number"
          value={form.data.passport_number}
          onChange={(event) => form.setData("passport_number", event.target.value)}
        />
      </FormField>
      <FormField id="designation" label="Designation" required error={form.errors.designation}>
        <Input id="designation" value={form.data.designation} onChange={(event) => form.setData("designation", event.target.value)} />
      </FormField>
      <FormField id="country_represented" label="Country represented" required error={form.errors.country_represented}>
        <Input
          id="country_represented"
          value={form.data.country_represented}
          onChange={(event) => form.setData("country_represented", event.target.value)}
        />
      </FormField>
      <FormField id="accreditation_starts_on" label="Accreditation start" required error={form.errors.accreditation_starts_on}>
        <DateInput
          id="accreditation_starts_on"
          value={form.data.accreditation_starts_on}
          onChange={(event) => form.setData("accreditation_starts_on", event.target.value)}
        />
      </FormField>
      <FormField id="accreditation_ends_on" label="Accreditation end" error={form.errors.accreditation_ends_on}>
        <DateInput
          id="accreditation_ends_on"
          value={form.data.accreditation_ends_on ?? ""}
          onChange={(event) => form.setData("accreditation_ends_on", event.target.value)}
        />
      </FormField>
      <FormField id="email" label="Email" error={form.errors.email}>
        <Input id="email" type="email" value={form.data.email ?? ""} onChange={(event) => form.setData("email", event.target.value)} />
      </FormField>
      <FormField id="phone" label="Phone" error={form.errors.phone}>
        <Input id="phone" value={form.data.phone ?? ""} onChange={(event) => form.setData("phone", event.target.value)} />
      </FormField>
    </div>
  );
}
