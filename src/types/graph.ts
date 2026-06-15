// Database row shapes (match supabase/migrations/0001_init.sql).
export interface DbNode {
  id: string;
  title: string;
  content: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string | null;
  created_by: string | null;
  created_at: string;
}

// Shapes consumed by react-force-graph. Links use `source`/`target` keys.
export interface GraphNode {
  id: string;
  title: string;
  content: string | null;
  type: string | null;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  relation_type: string | null;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Map DB rows into the structure react-force-graph expects.
export function toGraphData(nodes: DbNode[], edges: DbEdge[]): GraphData {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: n.type,
    })),
    links: edges.map((e) => ({
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      relation_type: e.relation_type,
    })),
  };
}
