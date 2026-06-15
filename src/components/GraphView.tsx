"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LinkObject, NodeObject } from "react-force-graph-2d";
import type { GraphData, GraphLink } from "@/types/graph";

// react-force-graph uses `window`/canvas, so it must load on the client only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Loading graph…
    </div>
  ),
});

export default function GraphView({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selected, setSelected] = useState<GraphLink | null>(null);

  // Keep the canvas sized to its container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLinkClick = useCallback((link: LinkObject) => {
    setSelected(link as unknown as GraphLink);
  }, []);

  const hasData = data.nodes.length > 0;

  return (
    <div ref={containerRef} className="relative h-full w-full bg-slate-950">
      {!hasData && (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-slate-400">
          No nodes yet. Create the first one using the form on the left.
        </div>
      )}

      {hasData && size.width > 0 && (
        <ForceGraph2D
          graphData={data}
          width={size.width}
          height={size.height}
          backgroundColor="#020617"
          nodeLabel={(node: NodeObject) =>
            `${node.title}${node.type ? ` · ${node.type}` : ""}`
          }
          nodeAutoColorBy="type"
          nodeRelSize={6}
          linkColor={() => "#475569"}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onLinkClick={handleLinkClick}
          enableNodeDrag={true}
          cooldownTicks={100}
        />
      )}

      {selected && (
        <div className="absolute right-3 top-3 max-w-xs rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-sm text-slate-200 shadow-lg">
          <div className="mb-1 flex items-center justify-between gap-4">
            <span className="font-medium">Edge</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300">
            Type:{" "}
            <span className="font-mono">
              {selected.relation_type ?? "—"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
