import { Head, useForm, usePage } from "@inertiajs/react";
import { Field } from "@/components/Form/Field";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from "@/Layouts/AppLayout";
import type { SharedProps } from "@/types";

export default function Edit() {
  const { auth } = usePage<SharedProps>().props;
  const user = auth?.user;
  const profile = useForm({ name: user?.name ?? "", email: user?.email ?? "" });
  const password = useForm({ current_password: "", password: "", password_confirmation: "" });
  const destroy = useForm({ password: "" });

  return (
    <AppLayout title="Profile">
      <Head title="Profile" />
      <PageHeader title="Profile" description="Update the signed-in account." />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              profile.patch("/profile");
            }}
          >
            <Field id="name" label="Name" error={profile.errors.name}>
              <Input id="name" value={profile.data.name} onChange={(event) => profile.setData("name", event.target.value)} />
            </Field>
            <Field id="email" label="Email" error={profile.errors.email}>
              <Input
                id="email"
                type="email"
                value={profile.data.email}
                onChange={(event) => profile.setData("email", event.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" disabled={profile.processing}>
                {profile.processing ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              password.put("/password", { onSuccess: () => password.reset() });
            }}
          >
            <Field id="current_password" label="Current password" error={password.errors.current_password}>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                value={password.data.current_password}
                onChange={(event) => password.setData("current_password", event.target.value)}
              />
            </Field>
            <Field id="password" label="New password" error={password.errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password.data.password}
                onChange={(event) => password.setData("password", event.target.value)}
              />
            </Field>
            <Field id="password_confirmation" label="Confirm password">
              <Input
                id="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={password.data.password_confirmation}
                onChange={(event) => password.setData("password_confirmation", event.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" disabled={password.processing}>
                {password.processing ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This permanently deletes the account. Enter the current password to confirm.
          </p>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              destroy.delete("/profile");
            }}
          >
            <Field id="delete_password" label="Password" error={destroy.errors.password}>
              <Input
                id="delete_password"
                type="password"
                autoComplete="current-password"
                value={destroy.data.password}
                onChange={(event) => destroy.setData("password", event.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" variant="destructive" disabled={destroy.processing}>
                {destroy.processing ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
