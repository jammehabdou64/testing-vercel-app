import { DateInput } from "@/components/Form/DateInput";
import { Field } from "@/components/Form/Field";
import { Input } from "@/components/ui/input";

export type PersonnelFormData = {
  full_name: string;
  date_of_birth: string;
  passport_number: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
};

type FormBinding = {
  data: PersonnelFormData;
  errors: Partial<Record<keyof PersonnelFormData, string>>;
  setData: <K extends keyof PersonnelFormData>(key: K, value: PersonnelFormData[K]) => void;
};

export function PersonnelFields({ form }: { form: FormBinding }) {
  return (
    <div className="grid gap-4">
      <Field id="full_name" label="Full name" required error={form.errors.full_name}>
        <Input
          id="full_name"
          value={form.data.full_name}
          onChange={(event) => form.setData("full_name", event.target.value)}
        />
      </Field>
      <Field id="date_of_birth" label="Date of birth" required error={form.errors.date_of_birth}>
        <DateInput
          id="date_of_birth"
          value={String(form.data.date_of_birth).slice(0, 10)}
          onChange={(event) => form.setData("date_of_birth", event.target.value)}
        />
      </Field>
      <Field id="passport_number" label="Passport number" required error={form.errors.passport_number}>
        <Input
          id="passport_number"
          value={form.data.passport_number}
          onChange={(event) => form.setData("passport_number", event.target.value)}
        />
      </Field>
      <Field id="designation" label="Designation" required error={form.errors.designation}>
        <Input
          id="designation"
          value={form.data.designation}
          onChange={(event) => form.setData("designation", event.target.value)}
        />
      </Field>
      <Field id="email" label="Email" error={form.errors.email}>
        <Input
          id="email"
          type="email"
          value={form.data.email}
          onChange={(event) => form.setData("email", event.target.value)}
        />
      </Field>
      <Field id="phone" label="Phone" error={form.errors.phone}>
        <Input
          id="phone"
          value={form.data.phone}
          onChange={(event) => form.setData("phone", event.target.value)}
        />
      </Field>
      <Field id="address" label="Address" error={form.errors.address}>
        <Input
          id="address"
          value={form.data.address}
          onChange={(event) => form.setData("address", event.target.value)}
        />
      </Field>
    </div>
  );
}
