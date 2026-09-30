import { Head, useForm, usePage } from "@inertiajs/react";
import GuestLayout from "../../Layouts/GuestLayout";
import type { SharedProps } from "../../types";

export default function VerifyEmail() {
  const form = useForm({});
  const logout = useForm({});
  const flash = usePage<SharedProps>().props.flash;
  const status = flash?.type === "status" ? flash.message : "";

  return (
    <GuestLayout>
      <Head title="Verify email" />
      <h1 className="kit-title">Verify email</h1>
      <p className="kit-muted mt-3">
        Thanks for signing up. Open the verification link before using the dashboard. The log mailer writes that link to the terminal running this app.
      </p>
      {status ? <p className="kit-status mt-4">{status}</p> : null}
      <div className="kit-row">
        <button type="button" className="kit-link" onClick={() => logout.post("/logout")}>
          Log out
        </button>
        <button type="button" className="kit-button" disabled={form.processing} onClick={() => form.post("/email/verification-notification")}>
          Resend link
        </button>
      </div>
    </GuestLayout>
  );
}
