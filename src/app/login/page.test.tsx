import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

let otpResult: { error: { message: string } | null };
const signInWithOtp = vi.fn(() => Promise.resolve(otpResult));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOtp } }),
}));

beforeEach(() => {
  otpResult = { error: null };
});
afterEach(() => vi.clearAllMocks());

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("requests a magic link and shows the sent confirmation", async () => {
    render(<LoginPage />);
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "person@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "person@example.com",
      options: { emailRedirectTo: expect.stringContaining("/auth/callback") },
    });
    expect(
      await screen.findByText(/A link was sent to person@example.com/),
    ).toBeInTheDocument();
  });

  it("shows an error and stays on the form when OTP fails", async () => {
    otpResult = { error: { message: "rate limit exceeded" } };
    render(<LoginPage />);
    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "person@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send link" }));

    expect(
      await screen.findByText("rate limit exceeded"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send link" })).toBeInTheDocument();
  });
});
