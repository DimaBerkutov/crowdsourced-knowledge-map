"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RELATION_TYPES = [
  "relates_to",
  "depends_on",
  "part_of",
  "contradicts",
  "supports",
];

export interface EdgeFormNode {
  id: string;
  title: string;
}

export default function CreateEdgeForm({
  nodes,
  canCreate,
}: {
  nodes: EdgeFormNode[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState(RELATION_TYPES[0]);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const enoughNodes = nodes.length >= 2;
  const disabled = !canCreate || !enoughNodes;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceId || !targetId) {
      setError("Select both nodes.");
      return;
    }
    if (sourceId === targetId) {
      setError("Source and target must be different.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();

    // Dev mode: writes are open, so an anonymous insert (created_by null) is
    // allowed. When signed in we still attribute the edge to the user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("km_edges").insert({
      source_id: sourceId,
      target_id: targetId,
      relation_type: relationType,
      created_by: user?.id ?? null,
    });

    setStatus("idle");

    if (insertError) {
      // 23505 = unique_violation (duplicate edge)
      setError(
        insertError.code === "23505"
          ? "This edge already exists."
          : insertError.message,
      );
      return;
    }

    setSourceId("");
    setTargetId("");
    setRelationType(RELATION_TYPES[0]);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-200">New edge</h2>

      {!canCreate && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Sign in to connect nodes.
        </p>
      )}

      {canCreate && !enoughNodes && (
        <p className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-400">
          You need at least two nodes to create an edge.
        </p>
      )}

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Source
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">— select a node —</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Relation type
        <select
          value={relationType}
          onChange={(e) => setRelationType(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        >
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Target
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={disabled}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">— select a node —</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={disabled || status === "saving"}
        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Create edge"}
      </button>
    </form>
  );
}
