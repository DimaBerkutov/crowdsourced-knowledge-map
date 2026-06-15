import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateNodeForm from "./CreateNodeForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

// Mutable per-test responses for the faked Supabase client.
let userResult: { data: { user: { id: string } | null } };
let insertResult: { error: { message: string } | null };
const insert = vi.fn(() => Promise.resolve(insertResult));
const from = vi.fn(() => ({ insert }));
const getUser = vi.fn(() => Promise.resolve(userResult));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser }, from }),
}));

beforeEach(() => {
  userResult = { data: { user: { id: "user-1" } } };
  insertResult = { error: null };
});
afterEach(() => vi.clearAllMocks());

describe("CreateNodeForm", () => {
  it("disables the form and shows a hint when the user cannot create", () => {
    render(<CreateNodeForm canCreate={false} />);
    expect(
      screen.getByText("Sign in to add nodes to the knowledge map."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Bayes' theorem")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create node" })).toBeDisabled();
  });

  it("validates that a title is required", async () => {
    render(<CreateNodeForm canCreate />);
    await userEvent.click(screen.getByRole("button", { name: "Create node" }));

    expect(screen.getByText("Enter a node title.")).toBeInTheDocument();
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts a node and resets the form on success", async () => {
    render(<CreateNodeForm canCreate />);
    await userEvent.type(
      screen.getByPlaceholderText("e.g. Bayes' theorem"),
      "Gradient Descent",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Short explanation (optional)"),
      "  iterative optimization  ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create node" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect(from).toHaveBeenCalledWith("km_nodes");
    expect(insert).toHaveBeenCalledWith({
      title: "Gradient Descent",
      content: "iterative optimization",
      type: "concept",
      created_by: "user-1",
    });
    // Title input cleared after success.
    expect(screen.getByPlaceholderText("e.g. Bayes' theorem")).toHaveValue("");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("stores null content when the description is left blank", async () => {
    render(<CreateNodeForm canCreate />);
    await userEvent.type(
      screen.getByPlaceholderText("e.g. Bayes' theorem"),
      "Bare Node",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create node" }));

    await waitFor(() => expect(insert).toHaveBeenCalled());
    expect((insert.mock.calls[0] as unknown[])[0]).toMatchObject({
      content: null,
    });
  });

  it("inserts anonymously (created_by null) when there is no user", async () => {
    userResult = { data: { user: null } };
    render(<CreateNodeForm canCreate />);
    await userEvent.type(
      screen.getByPlaceholderText("e.g. Bayes' theorem"),
      "Orphan",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create node" }));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    expect((insert.mock.calls[0] as unknown[])[0]).toMatchObject({
      title: "Orphan",
      created_by: null,
    });
  });

  it("surfaces a Supabase insert error", async () => {
    insertResult = { error: { message: "duplicate key value" } };
    render(<CreateNodeForm canCreate />);
    await userEvent.type(
      screen.getByPlaceholderText("e.g. Bayes' theorem"),
      "Boom",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create node" }));

    expect(await screen.findByText("duplicate key value")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
