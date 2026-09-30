import { Head, Link, useForm, usePage } from "@inertiajs/react";
import GuestLayout from "../../Layouts/GuestLayout";
import type { SharedProps } from "../../types";

export default function Login() {
  const form = useForm({ email: "", password: "" });
  const flash = usePage<SharedProps>().props.flash;
  const status = flash?.type === "status" ? flash.message : "";

  return (
    <GuestLayout>
      <Head title="Log in" />
      <h1 className="kit-title">Log in</h1>
      {status ? <p className="kit-status mt-4">{status}</p> : null}
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.post("/login");
        }}
      >
        <label className="kit-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="kit-input"
          value={form.data.email}
          autoComplete="username"
          onChange={(event) => form.setData("email", event.target.value)}
        />
        {form.errors.email ? <p className="kit-error">{form.errors.email}</p> : null}
        <div className="kit-field">
          <label className="kit-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="kit-input"
            value={form.data.password}
            autoComplete="current-password"
            onChange={(event) => form.setData("password", event.target.value)}
          />
          {form.errors.password ? <p className="kit-error">{form.errors.password}</p> : null}
        </div>
        <div className="kit-row">
          <Link href="/forgot-password" className="kit-link">
            Forgot your password?
          </Link>
          <button className="kit-button" disabled={form.processing}>
            Log in
          </button>
        </div>
      </form>
      <p className="kit-muted mt-6">
        Need an account?{" "}
        <Link href="/register" className="kit-link">
          Register
        </Link>
      </p>
    </GuestLayout>
  );
}
