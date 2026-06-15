import { describe, expect, it, vi } from "vitest";

// vi.mock is hoisted above imports, so the mock fn must be created in a hoisted
// block to avoid referencing an uninitialized top-level const.
const { updateSession } = vi.hoisted(() => ({
  updateSession: vi.fn().mockResolvedValue({ marker: "response" }),
}));
vi.mock("@/lib/supabase/middleware", () => ({ updateSession }));

import { config, proxy } from "./proxy";

describe("proxy", () => {
  it("delegates to updateSession with the request", async () => {
    const request = { url: "http://localhost/x" } as never;
    const res = await proxy(request);

    expect(updateSession).toHaveBeenCalledWith(request);
    expect(res).toEqual({ marker: "response" });
  });

  it("exposes a matcher that excludes static assets", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    const matcher = config.matcher[0];
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("_next/image");
    expect(matcher).toContain("favicon.ico");
  });
});
