import { RoleSlug } from "../../../../app/Auth/RoleSlug";
import { FormField } from "@/components/Form/Field";
import { Select } from "@/components/Form/Select";
import { Input } from "@/components/ui/input";

export type AssignmentChoices = {
  roles: { slug: string; name: string }[];
  personnel: { id: number; full_name: string }[];
  missions: { id: number; name: string }[];
};

export type AccountFormData = {
  name: string;
  email: string;
  password: string;
  role: string;
  personnel_id: string;
  mission_id: string;
};

type Binding = {
  data: AccountFormData;
  errors: Partial<Record<keyof AccountFormData, string>>;
  setData: (data: AccountFormData) => void;
};

const optionalPersonnel = new Set<string>([
  RoleSlug.Administrator,
  RoleSlug.HonorableMinister,
  RoleSlug.PermanentSecretary,
]);

export function postedAccount(data: AccountFormData, includePassword: boolean) {
  const personnel =
    data.role === RoleSlug.MissionPostUser ? "" : data.personnel_id;
  const mission = data.role === RoleSlug.MissionPostUser ? data.mission_id : "";

  return {
    name: data.name,
    email: data.email,
    role: data.role,
    personnel_id: personnel,
    mission_id: mission,
    ...(includePassword ? { password: data.password } : {}),
  };
}

export function AccountFields({
  form,
  choices,
  includePassword,
}: {
  form: Binding;
  choices: AssignmentChoices;
  includePassword: boolean;
}) {
  const role = form.data.role;
  const showPersonnel = role === RoleSlug.ForeignServiceOfficer || optionalPersonnel.has(role);
  const showMission = role === RoleSlug.MissionPostUser;

  function update(patch: Partial<AccountFormData>) {
    form.setData({ ...form.data, ...patch });
  }

  return (
    <div className="grid gap-4">
      <FormField id="name" label="Name" required error={form.errors.name}>
        <Input id="name" value={form.data.name} onChange={(event) => update({ name: event.target.value })} />
      </FormField>
      <FormField id="email" label="Email" required error={form.errors.email}>
        <Input
          id="email"
          type="email"
          value={form.data.email}
          onChange={(event) => update({ email: event.target.value })}
        />
      </FormField>
      {includePassword ? (
        <FormField id="password" label="Password" required error={form.errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.data.password}
            onChange={(event) => update({ password: event.target.value })}
          />
        </FormField>
      ) : null}
      <FormField id="role" label="Role" required error={form.errors.role}>
        <Select
          id="role"
          value={form.data.role}
          onChange={(event) =>
            update({
              role: event.target.value,
              personnel_id: event.target.value === RoleSlug.MissionPostUser ? "" : form.data.personnel_id,
              mission_id: event.target.value === RoleSlug.MissionPostUser ? form.data.mission_id : "",
            })
          }
        >
          <option value="">Select a role</option>
          {choices.roles.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </Select>
      </FormField>
      {showPersonnel ? (
        <FormField
          id="personnel_id"
          label="Personnel"
          required={role === RoleSlug.ForeignServiceOfficer}
          error={form.errors.personnel_id}
        >
          <Select
            id="personnel_id"
            value={form.data.personnel_id}
            onChange={(event) => update({ personnel_id: event.target.value })}
          >
            <option value="">{role === RoleSlug.ForeignServiceOfficer ? "Select personnel" : "No personnel link"}</option>
            {choices.personnel.map((record) => (
              <option key={record.id} value={record.id}>
                {record.full_name}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
      {showMission ? (
        <FormField id="mission_id" label="Mission" required error={form.errors.mission_id}>
          <Select
            id="mission_id"
            value={form.data.mission_id}
            onChange={(event) => update({ mission_id: event.target.value })}
          >
            <option value="">Select a mission</option>
            {choices.missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.name}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
    </div>
  );
}
