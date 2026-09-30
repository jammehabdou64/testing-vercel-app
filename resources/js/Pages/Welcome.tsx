import { Head, Link, usePage } from "@inertiajs/react";
import type { SharedProps } from "../types";

export default function Welcome({ name = "Javel" }: { name?: string }) {
  const { auth } = usePage<SharedProps>().props;
  const signedIn = Boolean(auth?.user?.email);

  return (
    <main className="min-h-screen bg-[#10130f] font-sans text-[#f4f1ea] antialiased">
      <Head title={`${name} · React`} />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-[11px] tracking-[0.32em] text-[#c6f25c] uppercase">React</p>
        <h1 className="mt-4 font-serif text-7xl tracking-tight">{name}</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed font-light text-[#b7b1a6]">
          Register, sign in, and open the dashboard. The server owns the routes. This page is an Inertia component.
        </p>
        <div className="mt-8 flex gap-4 text-sm">
          {signedIn ? (
            <Link href="/dashboard" className="rounded-full bg-[#c6f25c] px-5 py-2 text-[#10130f]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full bg-[#c6f25c] px-5 py-2 text-[#10130f]">
                Log in
              </Link>
              <Link href="/register" className="rounded-full border border-[#f4f1ea]/30 px-5 py-2">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
