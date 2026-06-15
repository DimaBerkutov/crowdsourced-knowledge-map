"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (otpError) {
      setStatus("idle");
      setError(otpError.message);
      return;
    }

    setStatus("sent");
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
          ← Back to map
        </Link>
        <h1 className="mt-3 text-lg font-semibold text-slate-100">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email — we&apos;ll send a magic link to sign in.
        </p>

        {status === "sent" ? (
          <p className="mt-6 rounded-md bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300">
            A link was sent to {email}. Open the email to sign in.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
