import { FormField } from "@/components/Form/Field";
import { Input } from "@/components/ui/input";

export type ForeignMissionForm = {
  name: string;
  country: string;
  address: string;
  email: string;
  phone: string;
};

type Binding = {
  data: ForeignMissionForm;
  errors: Partial<Record<keyof ForeignMissionForm, string>>;
  setData: <K extends keyof ForeignMissionForm>(key: K, value: ForeignMissionForm[K]) => void;
};

export function ForeignMissionFields({ form }: { form: Binding }) {
  return (
    <div className="grid gap-4">
      <FormField id="name" label="Mission" required error={form.errors.name}>
        <Input id="name" value={form.data.name} onChange={(event) => form.setData("name", event.target.value)} />
      </FormField>
      <FormField id="country" label="Country" required error={form.errors.country}>
        <Input id="country" value={form.data.country} onChange={(event) => form.setData("country", event.target.value)} />
      </FormField>
      <FormField id="address" label="Address" required error={form.errors.address}>
        <Input id="address" value={form.data.address} onChange={(event) => form.setData("address", event.target.value)} />
      </FormField>
      <FormField id="email" label="Email" required error={form.errors.email}>
        <Input id="email" type="email" value={form.data.email} onChange={(event) => form.setData("email", event.target.value)} />
      </FormField>
      <FormField id="phone" label="Phone" required error={form.errors.phone}>
        <Input id="phone" value={form.data.phone} onChange={(event) => form.setData("phone", event.target.value)} />
      </FormField>
    </div>
  );
}
