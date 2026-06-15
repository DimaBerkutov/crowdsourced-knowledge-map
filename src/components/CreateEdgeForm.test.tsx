import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateEdgeForm, { type EdgeFormNode } from "./CreateEdgeForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

let userResult: { data: { user: { id: string } | null } };
let insertResult: { error: { message: string; code?: string } | null };
const insert = vi.fn(() => Promise.resolve(insertResult));
const from = vi.fn(() => ({ insert }));
const getUser = vi.fn(() => Promise.resolve(userResult));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser }, from }),
}));

const NODES: EdgeFormNode[] = [
  { id: "a", title: "Alpha" },
  { id: "b", title: "Beta" },
];

beforeEach(() => {
  userResult = { data: { user: { id: "user-1" } } };
  insertResult = { error: null };
});
afterEach(() => vi.clearAllMocks());

describe("CreateEdgeForm", () => {
  it("prompts to sign in when the user cannot create", () => {
    render(<CreateEdgeForm canCreate={false} nodes={NODES} />);
    expect(screen.getByText("Sign in to connect nodes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create edge" })).toBeDisabled();
  });

  it("requires at least two nodes", () => {
    render(<CreateEdgeForm canCreate nodes={[{ id: "a", title: "Alpha" }]} />);
    expect(
      screen.getByText("You need at least two nodes to create an edge."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create edge" })).toBeDisabled();
  });

  it("validates that both endpoints are selected", async () => {
    render(<CreateEdgeForm canCreate nodes={NODES} />);
    await userEvent.click(screen.getByRole("button", { name: "Create edge" }));
    expect(screen.getByText("Select both nodes.")).toBeInTheDocument();
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a self-loop", async () => {
    render(<CreateEdgeForm canCreate nodes={NODES} />);
    await userEvent.selectOptions(screen.getByLabelText("Source"), "a");
    await userEvent.selectOptions(screen.getByLabelText("Target"), "a");
    await userEvent.click(screen.getByRole("button", { name: "Create edge" }));

    expect(
      screen.getByText("Source and target must be different."),
    ).toBeInTheDocument();
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts an edge and refreshes on success", async () => {
    render(<CreateEdgeForm canCreate nodes={NODES} />);
    await userEvent.selectOptions(screen.getByLabelText("Source"), "a");
    await userEvent.selectOptions(screen.getByLabelText("Target"), "b");
    await userEvent.selectOptions(
      screen.getByLabelText("Relation type"),
      "depends_on",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create edge" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(from).toHaveBeenCalledWith("km_edges");
    expect(insert).toHaveBeenCalledWith({
      source_id: "a",
      target_id: "b",
      relation_type: "depends_on",
      created_by: "user-1",
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("inserts anonymously (created_by null) when there is no user", async () => {
    userResult = { data: { user: null } };
    render(<CreateEdgeForm canCreate nodes={NODES} />);
    await userEvent.selectOptions(screen.getByLabelText("Source"), "a");
    await userEvent.selectOptions(screen.getByLabelText("Target"), "b");
    await userEvent.click(screen.getByRole("button", { name: "Create edge" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect((insert.mock.calls[0] as unknown[])[0]).toMatchObject({
      source_id: "a",
      target_id: "b",
      created_by: null,
    });
  });

  it("maps a unique-violation (23505) to a friendly message", async () => {
    insertResult = { error: { message: "dupe", code: "23505" } };
    render(<CreateEdgeForm canCreate nodes={NODES} />);
    await userEvent.selectOptions(screen.getByLabelText("Source"), "a");
    await userEvent.selectOptions(screen.getByLabelText("Target"), "b");
    await userEvent.click(screen.getByRole("button", { name: "Create edge" }));

    expect(
      await screen.findByText("This edge already exists."),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
