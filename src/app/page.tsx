import AuthButton from "@/components/AuthButton";
import CreateEdgeForm from "@/components/CreateEdgeForm";
import CreateNodeForm from "@/components/CreateNodeForm";
import GraphView from "@/components/GraphView";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { toGraphData, type DbEdge, type DbNode } from "@/types/graph";

export default async function Home() {
  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-full items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm">
          <h1 className="text-lg font-semibold">Connect Supabase</h1>
          <p className="mt-2 text-slate-400">
            Fill in <code className="text-slate-200">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="text-slate-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            in <code className="text-slate-200">.env.local</code>, apply the
            migration{" "}
            <code className="text-slate-200">
              supabase/migrations/0001_init.sql
            </code>{" "}
            and restart <code className="text-slate-200">npm run dev</code>.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const [{ data: user }, nodesRes, edgesRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("km_nodes")
      .select("id, title, content, type, created_by, created_at, updated_at"),
    supabase
      .from("km_edges")
      .select("id, source_id, target_id, relation_type, created_by, created_at"),
  ]);

  const nodes = (nodesRes.data ?? []) as DbNode[];
  const edges = (edgesRes.data ?? []) as DbEdge[];
  const graphData = toGraphData(nodes, edges);

  const email = user.user?.email ?? null;
  const loadError = nodesRes.error?.message ?? edgesRes.error?.message ?? null;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div>
          <h1 className="text-base font-semibold">Crowdsourced Knowledge Map</h1>
          <p className="text-xs text-slate-500">
            {nodes.length} nodes · {edges.length} edges
          </p>
        </div>
        <AuthButton email={email} />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-slate-800 p-5">
          {/* Dev mode: writes are open to everyone (see migration 0002). */}
          <CreateNodeForm canCreate={true} />
          <hr className="border-slate-800" />
          <CreateEdgeForm
            canCreate={true}
            nodes={nodes.map((n) => ({ id: n.id, title: n.title }))}
          />
          {loadError && (
            <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
              Failed to load the graph: {loadError}. Check your Supabase
              variables in .env.local and that the migration was applied.
            </p>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <GraphView data={graphData} />
        </main>
      </div>
    </div>
  );
}
