import { Head, Link, useForm, usePage } from "@inertiajs/react";
import GuestLayout from "../../Layouts/GuestLayout";
import type { SharedProps } from "../../types";

export default function ForgotPassword() {
  const form = useForm({ email: "" });
  const flash = usePage<SharedProps>().props.flash;
  const status = flash?.type === "status" ? flash.message : "";

  return (
    <GuestLayout>
      <Head title="Forgot password" />
      <h1 className="kit-title">Forgot password</h1>
      <p className="kit-muted mt-3">We will email a reset link. With the log mailer, that link is printed in the server log.</p>
      {status ? <p className="kit-status mt-4">{status}</p> : null}
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.post("/forgot-password");
        }}
      >
        <label className="kit-label" htmlFor="email">
          Email
        </label>
        <input id="email" type="email" className="kit-input" value={form.data.email} onChange={(event) => form.setData("email", event.target.value)} />
        {form.errors.email ? <p className="kit-error">{form.errors.email}</p> : null}
        <div className="kit-row">
          <Link href="/login" className="kit-link">
            Back to log in
          </Link>
          <button className="kit-button" disabled={form.processing}>
            Email reset link
          </button>
        </div>
      </form>
    </GuestLayout>
  );
}
