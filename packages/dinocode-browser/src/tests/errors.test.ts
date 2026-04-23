import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  BROWSER_ERROR_DEFAULT_HINTS,
  BROWSER_ERROR_KINDS,
  BROWSER_ERROR_RETRY_POLICY,
  BrowserError,
  hintFor,
  isRetryable,
} from "../shared/errors.ts";
import { BrowserToolErrorKindSchema } from "../shared/schemas.ts";

describe("browser error taxonomy", () => {
  it("runtime kinds match the wire schema literals", () => {
    const runtime = new Set<string>(BROWSER_ERROR_KINDS);
    const wire = new Set<string>(BrowserToolErrorKindSchema.literals);
    expect(runtime).toEqual(wire);
  });

  it("every kind has a retry policy and a hint", () => {
    for (const kind of BROWSER_ERROR_KINDS) {
      const policy = BROWSER_ERROR_RETRY_POLICY[kind];
      expect(policy === "retryable" || policy === "fatal").toBe(true);
      const hint = BROWSER_ERROR_DEFAULT_HINTS[kind];
      expect(hint.length).toBeGreaterThan(10);
      expect(hint.length).toBeLessThanOrEqual(200);
    }
  });

  it("isRetryable agrees with the policy table", () => {
    expect(isRetryable("LoadFailed")).toBe(true);
    expect(isRetryable("NavigationBlocked")).toBe(false);
    expect(isRetryable("Timeout")).toBe(true);
    expect(isRetryable("Internal")).toBe(false);
    expect(isRetryable("PermissionDenied")).toBe(false);
    expect(isRetryable("RateLimited")).toBe(true);
  });

  it("BrowserError applies canonical defaults for each kind", () => {
    const loadFailed = BrowserError("LoadFailed", "boom");
    expect(loadFailed.retryable).toBe(true);
    expect(loadFailed.hint).toBe(hintFor("LoadFailed"));

    const blocked = BrowserError("NavigationBlocked", "nope");
    expect(blocked.retryable).toBe(false);
    expect(blocked.hint).toMatch(/allowlist/);
  });

  it("caller overrides win over the defaults", () => {
    const err = BrowserError("Timeout", "waiter", {
      retryable: false,
      hint: "custom",
      details: { deadline: 1000 },
    });
    expect(err.retryable).toBe(false);
    expect(err.hint).toBe("custom");
    expect(err.details).toEqual({ deadline: 1000 });
  });

  it("every canonical hint fits in the wire schema's hint length cap", () => {
    const decode = Schema.decodeUnknownSync(
      Schema.String.pipe(Schema.check(Schema.isMaxLength(512))),
    );
    for (const kind of BROWSER_ERROR_KINDS) {
      expect(() => decode(BROWSER_ERROR_DEFAULT_HINTS[kind])).not.toThrow();
    }
  });
});
