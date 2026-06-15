"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton({ email }: { email: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
      >
        Sign in
      </Link>
    );
  }

  const signOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-400">{email}</span>
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="rounded-md border border-slate-600 px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "…" : "Sign out"}
      </button>
    </div>
  );
}
