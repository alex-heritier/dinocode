import { describe, expect, it } from "vitest";

import { BrowserError, BufferCursor, CdpSessionId, TabId } from "../shared/index.ts";

describe("@dinocode/browser scaffold", () => {
  it("brands ids without runtime overhead", () => {
    const tab = TabId("tab-1");
    const cdp = CdpSessionId("cdp-1");
    const cursor = BufferCursor(0);
    expect(tab).toBe("tab-1");
    expect(cdp).toBe("cdp-1");
    expect(cursor).toBe(0);
  });

  it("constructs structured errors with sane defaults", () => {
    const err = BrowserError("NotFound", "tab 123 not found");
    expect(err.kind).toBe("NotFound");
    expect(err.retryable).toBe(true);
    expect(err.hint).toMatch(/selector|tab id/i);
    expect(err.details).toBeUndefined();
  });

  it("honors opt-in details + retryable flags", () => {
    const err = BrowserError("Timeout", "10s exceeded", {
      retryable: false,
      details: { url: "https://example.com" },
    });
    expect(err.retryable).toBe(false);
    expect(err.details).toEqual({ url: "https://example.com" });
  });
});
