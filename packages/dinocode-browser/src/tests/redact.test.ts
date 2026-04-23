import { describe, expect, it } from "vitest";

import {
  DEFAULT_REDACTION_KEYS,
  REDACTED_PLACEHOLDER,
  redact,
  redactHeaders,
} from "../logging/redact.ts";

describe("redact()", () => {
  it("case-insensitively redacts default keys", () => {
    const input = {
      Cookie: "yum",
      AUTHORIZATION: "bearer x",
      "Set-Cookie": "abc",
      "x-api-key": "k",
      accept: "json",
    };
    expect(redact(input)).toEqual({
      Cookie: REDACTED_PLACEHOLDER,
      AUTHORIZATION: REDACTED_PLACEHOLDER,
      "Set-Cookie": REDACTED_PLACEHOLDER,
      "x-api-key": REDACTED_PLACEHOLDER,
      accept: "json",
    });
  });

  it("walks nested objects and arrays without mutating input", () => {
    const input = {
      headers: [{ Cookie: "1" }, { accept: "ok" }],
      body: { password: "p", inner: { token: "t", k: 1 } },
    };
    const snapshot = structuredClone(input);
    const out = redact(input);
    expect(out).toEqual({
      headers: [
        { Cookie: REDACTED_PLACEHOLDER },
        { accept: "ok" },
      ],
      body: {
        password: REDACTED_PLACEHOLDER,
        inner: { token: REDACTED_PLACEHOLDER, k: 1 },
      },
    });
    expect(input).toEqual(snapshot);
  });

  it("survives circular references", () => {
    const cycle: Record<string, unknown> = { name: "x" };
    cycle.self = cycle;
    const out = redact(cycle) as { name: string; self: unknown };
    expect(out.name).toBe("x");
    expect(out.self).toBe(out);
  });

  it("honours extraKeys", () => {
    const input = { custom: "secret", keep: "ok" };
    expect(redact(input, { extraKeys: ["custom"] })).toEqual({
      custom: REDACTED_PLACEHOLDER,
      keep: "ok",
    });
  });

  it("honours replacement token", () => {
    expect(redact({ cookie: "a" }, { replacement: "***" })).toEqual({
      cookie: "***",
    });
  });

  it("leaves primitives and dates/regex untouched by content", () => {
    const d = new Date("2026-04-23T00:00:00Z");
    const r = /foo/gi;
    const out = redact({ n: 1, s: "s", b: true, d, r, nil: null });
    expect(out.n).toBe(1);
    expect(out.s).toBe("s");
    expect(out.b).toBe(true);
    expect(out.nil).toBeNull();
    expect(out.d).not.toBe(d);
    expect(out.d.getTime()).toBe(d.getTime());
    expect(out.r).not.toBe(r);
    expect(out.r.source).toBe("foo");
    expect(out.r.flags).toBe("gi");
  });

  it("redactHeaders is a typed helper for headers", () => {
    expect(redactHeaders({ Cookie: "a", Accept: "b" })).toEqual({
      Cookie: REDACTED_PLACEHOLDER,
      Accept: "b",
    });
  });

  it("DEFAULT_REDACTION_KEYS is frozen-like policy", () => {
    expect(DEFAULT_REDACTION_KEYS).toContain("cookie");
    expect(DEFAULT_REDACTION_KEYS).toContain("authorization");
    expect(DEFAULT_REDACTION_KEYS).toContain("token");
  });
});
