import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mutable state shared with the hoisted module mocks below.
const state = vi.hoisted(() => ({
  configured: true,
  user: { email: "me@example.com" } as { email: string } | null,
  nodes: [] as unknown[],
  edges: [] as unknown[],
  nodesError: null as { message: string } | null,
}));

vi.mock("@/lib/supabase/env", () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => ({
      select: async () =>
        table === "km_nodes"
          ? { data: state.nodes, error: state.nodesError }
          : { data: state.edges, error: null },
    }),
  })),
}));

// Stub client components so the server component renders in isolation.
vi.mock("@/components/AuthButton", () => ({
  default: ({ email }: { email: string | null }) => (
    <div data-testid="auth">{email ?? "anon"}</div>
  ),
}));
vi.mock("@/components/CreateNodeForm", () => ({
  default: ({ canCreate }: { canCreate: boolean }) => (
    <div data-testid="node-form">{String(canCreate)}</div>
  ),
}));
vi.mock("@/components/CreateEdgeForm", () => ({
  default: ({ nodes }: { nodes: unknown[] }) => (
    <div data-testid="edge-form">{nodes.length}</div>
  ),
}));
vi.mock("@/components/GraphView", () => ({
  default: ({ data }: { data: { nodes: unknown[] } } ) => (
    <div data-testid="graph">{data.nodes.length}</div>
  ),
}));

import Home from "./page";

beforeEach(() => {
  state.configured = true;
  state.user = { email: "me@example.com" };
  state.nodes = [
    { id: "a", title: "A", content: null, type: "concept", created_by: null, created_at: "", updated_at: "" },
    { id: "b", title: "B", content: null, type: "fact", created_by: null, created_at: "", updated_at: "" },
  ];
  state.edges = [
    { id: "e", source_id: "a", target_id: "b", relation_type: "supports", created_by: null, created_at: "" },
  ];
  state.nodesError = null;
});
afterEach(() => vi.clearAllMocks());

describe("Home page", () => {
  it("shows the setup screen when Supabase is not configured", async () => {
    state.configured = false;
    render(await Home());
    expect(
      screen.getByRole("heading", { name: "Connect Supabase" }),
    ).toBeInTheDocument();
  });

  it("renders counts and passes data to the graph when configured", async () => {
    render(await Home());
    expect(screen.getByText("2 nodes · 1 edges")).toBeInTheDocument();
    expect(screen.getByTestId("graph")).toHaveTextContent("2");
    expect(screen.getByTestId("edge-form")).toHaveTextContent("2");
    expect(screen.getByTestId("auth")).toHaveTextContent("me@example.com");
  });

  it("enables creation even when signed out (dev mode: open writes)", async () => {
    state.user = null;
    render(await Home());
    expect(screen.getByTestId("node-form")).toHaveTextContent("true");
  });

  it("surfaces a load error message", async () => {
    state.nodesError = { message: "boom" };
    render(await Home());
    expect(screen.getByText(/Failed to load the graph: boom/)).toBeInTheDocument();
  });
});
