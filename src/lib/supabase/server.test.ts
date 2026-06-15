import { afterEach, describe, expect, it, vi } from "vitest";

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(() => ({ marker: "server-client" })),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

const { cookies } = vi.hoisted(() => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => [{ name: "sb", value: "1" }]),
    set: vi.fn(),
  })),
}));
vi.mock("next/headers", () => ({ cookies }));

import { createClient } from "./server";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("createClient (server)", () => {
  it("awaits cookies and wires env vars into createServerClient", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const client = await createClient();

    expect(cookies).toHaveBeenCalledTimes(1);
    expect(createServerClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-123",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
    expect(client).toEqual({ marker: "server-client" });
  });

  it("reads cookies through the provided getAll adapter", async () => {
    await createClient();
    const options = (createServerClient.mock.calls[0] as unknown[])[2] as {
      cookies: { getAll: () => unknown };
    };
    expect(options.cookies.getAll()).toEqual([{ name: "sb", value: "1" }]);
  });
});
