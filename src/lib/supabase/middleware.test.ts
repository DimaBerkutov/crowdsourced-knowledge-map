import { afterEach, describe, expect, it, vi } from "vitest";

// --- Shared mocks ------------------------------------------------------------
const getUser = vi.fn().mockResolvedValue({ data: { user: null } });
const createServerClient = vi.fn(() => ({ auth: { getUser } }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

const nextResponse = { cookies: { set: vi.fn() } };
const next = vi.fn(() => nextResponse);
vi.mock("next/server", () => ({ NextResponse: { next } }));

const makeRequest = () =>
  ({ cookies: { getAll: () => [], set: vi.fn() } }) as never;

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("updateSession", () => {
  it("refreshes the session by calling getUser when configured", async () => {
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: true }));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");

    const { updateSession } = await import("./middleware");
    const res = await updateSession(makeRequest());

    expect(createServerClient).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "anon-123",
      expect.any(Object),
    );
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(res).toBe(nextResponse);
  });

  it("returns early without a client when Supabase is not configured", async () => {
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: false }));

    const { updateSession } = await import("./middleware");
    const res = await updateSession(makeRequest());

    expect(createServerClient).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(res).toBe(nextResponse);
  });
});
