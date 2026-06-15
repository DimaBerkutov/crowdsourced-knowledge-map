import { describe, expect, it } from "vitest";
import { toGraphData, type DbEdge, type DbNode } from "./graph";

const node = (over: Partial<DbNode> = {}): DbNode => ({
  id: "n1",
  title: "Node 1",
  content: "content",
  type: "concept",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...over,
});

const edge = (over: Partial<DbEdge> = {}): DbEdge => ({
  id: "e1",
  source_id: "n1",
  target_id: "n2",
  relation_type: "relates_to",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  ...over,
});

describe("toGraphData", () => {
  it("returns empty graph for empty input", () => {
    expect(toGraphData([], [])).toEqual({ nodes: [], links: [] });
  });

  it("maps DB node fields onto graph nodes and drops bookkeeping columns", () => {
    const { nodes } = toGraphData([node({ id: "a", title: "A" })], []);
    expect(nodes).toEqual([
      { id: "a", title: "A", content: "content", type: "concept" },
    ]);
    // created_by / created_at / updated_at must not leak into the graph node.
    expect(nodes[0]).not.toHaveProperty("created_at");
    expect(nodes[0]).not.toHaveProperty("created_by");
  });

  it("renames source_id/target_id to source/target for react-force-graph", () => {
    const { links } = toGraphData(
      [node({ id: "n1" }), node({ id: "n2" })],
      [edge({ id: "e1", source_id: "n1", target_id: "n2" })],
    );
    expect(links).toEqual([
      { id: "e1", source: "n1", target: "n2", relation_type: "relates_to" },
    ]);
  });

  it("preserves null content/type and relation_type", () => {
    const { nodes, links } = toGraphData(
      [node({ content: null, type: null })],
      [edge({ relation_type: null })],
    );
    expect(nodes[0].content).toBeNull();
    expect(nodes[0].type).toBeNull();
    expect(links[0].relation_type).toBeNull();
  });

  it("keeps the order and count of nodes and edges", () => {
    const dbNodes = [node({ id: "a" }), node({ id: "b" }), node({ id: "c" })];
    const dbEdges = [
      edge({ id: "e1", source_id: "a", target_id: "b" }),
      edge({ id: "e2", source_id: "b", target_id: "c" }),
    ];
    const { nodes, links } = toGraphData(dbNodes, dbEdges);
    expect(nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
    expect(links.map((l) => l.id)).toEqual(["e1", "e2"]);
  });
});
