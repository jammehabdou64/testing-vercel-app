import { Head, useForm } from "@inertiajs/react";
import GuestLayout from "../../Layouts/GuestLayout";

export default function ResetPassword({ token, email }: { token: string; email: string }) {
  const form = useForm({ token, email, password: "", password_confirmation: "" });

  return (
    <GuestLayout>
      <Head title="Reset password" />
      <h1 className="kit-title">Reset password</h1>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.post("/reset-password");
        }}
      >
        <label className="kit-label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" className="kit-input" value={form.data.email} onChange={(event) => form.setData("email", event.target.value)} />
        {form.errors.email ? <p className="kit-error">{form.errors.email}</p> : null}
        <div className="kit-field">
          <label className="kit-label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="kit-input" value={form.data.password} autoComplete="new-password" onChange={(event) => form.setData("password", event.target.value)} />
          {form.errors.password ? <p className="kit-error">{form.errors.password}</p> : null}
        </div>
        <div className="kit-field">
          <label className="kit-label" htmlFor="password_confirmation">
            Confirm password
          </label>
          <input id="password_confirmation" type="password" className="kit-input" value={form.data.password_confirmation} autoComplete="new-password" onChange={(event) => form.setData("password_confirmation", event.target.value)} />
        </div>
        <div className="kit-row">
          <span />
          <button className="kit-button" disabled={form.processing}>
            Reset password
          </button>
        </div>
      </form>
    </GuestLayout>
  );
}
