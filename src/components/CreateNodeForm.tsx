"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NODE_TYPES = ["concept", "fact", "question", "resource"];

export default function CreateNodeForm({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(NODE_TYPES[0]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Enter a node title.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();

    // Dev mode: writes are open, so an anonymous insert (created_by null) is
    // allowed. When signed in we still attribute the node to the user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("km_nodes").insert({
      title: title.trim(),
      content: content.trim() || null,
      type,
      created_by: user?.id ?? null,
    });

    setStatus("idle");

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitle("");
    setContent("");
    setType(NODE_TYPES[0]);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-200">New node</h2>

      {!canCreate && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Sign in to add nodes to the knowledge map.
        </p>
      )}

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canCreate}
          placeholder="e.g. Bayes' theorem"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Description
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canCreate}
          rows={3}
          placeholder="Short explanation (optional)"
          className="resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={!canCreate}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!canCreate || status === "saving"}
        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Create node"}
      </button>
    </form>
  );
}
