import { afterEach, describe, expect, it, vi } from "vitest";

// `isSupabaseConfigured` is computed at module load, so each case resets the
// module registry and re-imports with the env vars set for that scenario.
const load = async () => {
  const mod = await import("./env");
  return mod.isSupabaseConfigured;
};

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("isSupabaseConfigured", () => {
  it("is true when both URL and anon key are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    expect(await load()).toBe(true);
  });

  it("is false when the URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    expect(await load()).toBe(false);
  });

  it("is false when the anon key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(await load()).toBe(false);
  });

  it("is false when both are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(await load()).toBe(false);
  });
});
