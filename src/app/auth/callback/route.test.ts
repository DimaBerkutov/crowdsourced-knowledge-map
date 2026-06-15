import { afterEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => ({ url })),
}));
vi.mock("next/server", () => ({ NextResponse: { redirect } }));

import { GET } from "./route";

afterEach(() => vi.clearAllMocks());

describe("auth callback GET", () => {
  it("exchanges the code and redirects to the default target on success", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    await GET(new Request("https://app.test/auth/callback?code=abc"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(redirect).toHaveBeenCalledWith("https://app.test/");
  });

  it("honors the `next` param on success", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    await GET(
      new Request("https://app.test/auth/callback?code=abc&next=/profile"),
    );
    expect(redirect).toHaveBeenCalledWith("https://app.test/profile");
  });

  it("redirects to the login error page when the exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "bad" } });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(redirect).toHaveBeenCalledWith("https://app.test/login?error=auth");
  });

  it("redirects to the login error page when no code is present", async () => {
    await GET(new Request("https://app.test/auth/callback"));
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("https://app.test/login?error=auth");
  });
});
