import { Head, Link, useForm } from "@inertiajs/react";
import GuestLayout from "../../Layouts/GuestLayout";

export default function Register() {
  const form = useForm({ name: "", email: "", password: "", password_confirmation: "" });

  return (
    <GuestLayout>
      <Head title="Register" />
      <h1 className="kit-title">Register</h1>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.post("/register");
        }}
      >
        <label className="kit-label" htmlFor="name">
          Name
        </label>
        <input id="name" className="kit-input" value={form.data.name} autoComplete="name" onChange={(event) => form.setData("name", event.target.value)} />
        {form.errors.name ? <p className="kit-error">{form.errors.name}</p> : null}
        <div className="kit-field">
          <label className="kit-label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="kit-input" value={form.data.email} autoComplete="username" onChange={(event) => form.setData("email", event.target.value)} />
          {form.errors.email ? <p className="kit-error">{form.errors.email}</p> : null}
        </div>
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
          <Link href="/login" className="kit-link">
            Already registered?
          </Link>
          <button className="kit-button" disabled={form.processing}>
            Register
          </button>
        </div>
      </form>
    </GuestLayout>
  );
}
