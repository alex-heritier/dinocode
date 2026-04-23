import { describe, expect, it } from "vitest";

import { marshalArg, marshalArgs } from "../capture/marshalArg.ts";

describe("marshalArg", () => {
  it("round-trips primitives", () => {
    expect(marshalArg("hello")).toEqual({ kind: "string", text: "hello" });
    expect(marshalArg(42)).toEqual({ kind: "number", text: "42" });
    expect(marshalArg(true)).toEqual({ kind: "boolean", text: "true" });
    expect(marshalArg(null)).toEqual({ kind: "null", text: "null" });
    expect(marshalArg(undefined)).toEqual({ kind: "undefined", text: "undefined" });
    expect(marshalArg(12n)).toEqual({ kind: "bigint", text: "12" });
  });

  it("encodes functions / symbols / regex / date as text", () => {
    expect(marshalArg(function foo() {}).text).toMatch(/^\[Function foo\]/);
    expect(marshalArg(Symbol("s")).text).toMatch(/Symbol/);
    expect(marshalArg(/x/g).text).toBe("/x/g");
    expect(marshalArg(new Date("2024-01-01T00:00:00Z")).text).toBe("2024-01-01T00:00:00.000Z");
  });

  it("serialises objects via JSON with circular-safe handling", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = marshalArg(obj);
    expect(result.kind).toBe("object");
    expect(result.text).toContain("[Circular]");
    expect(result.json).toContain("Circular");
  });

  it("captures error stack under kind=error", () => {
    const err = new Error("boom");
    const out = marshalArg(err);
    expect(out.kind).toBe("error");
    expect(out.text).toContain("Error: boom");
    expect(out.json).toContain("boom");
  });

  it("truncates over-long strings", () => {
    const long = "x".repeat(5000);
    const out = marshalArg(long, { maxStringLength: 128 });
    expect(out.truncated).toBe(true);
    expect(out.text.length).toBeLessThanOrEqual(128);
  });

  it("marshalArgs maps each entry independently", () => {
    const out = marshalArgs([1, "two", { three: 3 }]);
    expect(out.map((e) => e.kind)).toEqual(["number", "string", "object"]);
  });
});
