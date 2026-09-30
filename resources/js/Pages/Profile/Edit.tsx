import { Head, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "../../Layouts/AuthenticatedLayout";
import type { SharedProps } from "../../types";

export default function Edit() {
  const { auth, flash } = usePage<SharedProps>().props;
  const user = auth?.user;
  const status = flash?.type === "status" ? flash.message : "";
  const profile = useForm({ name: user?.name ?? "", email: user?.email ?? "" });
  const password = useForm({ current_password: "", password: "", password_confirmation: "" });
  const destroy = useForm({ password: "" });

  return (
    <AuthenticatedLayout>
      <Head title="Profile" />
      <div className="kit-stack">
        {status ? <p className="kit-status">{status}</p> : null}
        <section className="kit-card kit-wide">
          <h1 className="kit-title">Profile</h1>
          <p className="kit-muted mt-2">Update your name and email address.</p>
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              profile.patch("/profile");
            }}
          >
            <label className="kit-label" htmlFor="name">
              Name
            </label>
            <input id="name" className="kit-input" value={profile.data.name} onChange={(event) => profile.setData("name", event.target.value)} />
            {profile.errors.name ? <p className="kit-error">{profile.errors.name}</p> : null}
            <div className="kit-field">
              <label className="kit-label" htmlFor="email">
                Email
              </label>
              <input id="email" type="email" className="kit-input" value={profile.data.email} onChange={(event) => profile.setData("email", event.target.value)} />
              {profile.errors.email ? <p className="kit-error">{profile.errors.email}</p> : null}
            </div>
            <div className="kit-row">
              <span />
              <button className="kit-button" disabled={profile.processing}>
                Save
              </button>
            </div>
          </form>
        </section>
        <section className="kit-card kit-wide">
          <h2 className="kit-title">Password</h2>
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              password.put("/password", { onSuccess: () => password.reset() });
            }}
          >
            <label className="kit-label" htmlFor="current_password">
              Current password
            </label>
            <input id="current_password" type="password" className="kit-input" value={password.data.current_password} autoComplete="current-password" onChange={(event) => password.setData("current_password", event.target.value)} />
            {password.errors.current_password ? <p className="kit-error">{password.errors.current_password}</p> : null}
            <div className="kit-field">
              <label className="kit-label" htmlFor="password">
                New password
              </label>
              <input id="password" type="password" className="kit-input" value={password.data.password} autoComplete="new-password" onChange={(event) => password.setData("password", event.target.value)} />
              {password.errors.password ? <p className="kit-error">{password.errors.password}</p> : null}
            </div>
            <div className="kit-field">
              <label className="kit-label" htmlFor="password_confirmation">
                Confirm password
              </label>
              <input id="password_confirmation" type="password" className="kit-input" value={password.data.password_confirmation} autoComplete="new-password" onChange={(event) => password.setData("password_confirmation", event.target.value)} />
            </div>
            <div className="kit-row">
              <span />
              <button className="kit-button" disabled={password.processing}>
                Update password
              </button>
            </div>
          </form>
        </section>
        <section className="kit-card kit-wide">
          <h2 className="kit-title">Delete account</h2>
          <p className="kit-muted mt-2">This permanently deletes the account. Enter the current password to confirm.</p>
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              destroy.delete("/profile");
            }}
          >
            <label className="kit-label" htmlFor="delete_password">
              Password
            </label>
            <input id="delete_password" type="password" className="kit-input" value={destroy.data.password} autoComplete="current-password" onChange={(event) => destroy.setData("password", event.target.value)} />
            {destroy.errors.password ? <p className="kit-error">{destroy.errors.password}</p> : null}
            <div className="kit-row">
              <span />
              <button className="kit-button kit-button-danger" disabled={destroy.processing}>
                Delete account
              </button>
            </div>
          </form>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
