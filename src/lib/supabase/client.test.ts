import { afterEach, describe, expect, it, vi } from "vitest";

const createBrowserClient = vi.fn(() => ({ marker: "browser-client" }));
vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("createClient (browser)", () => {
  it("passes the public URL and anon key to createBrowserClient", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { createClient } = await import("./client");
    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-123",
    );
    expect(client).toEqual({ marker: "browser-client" });
  });
});
