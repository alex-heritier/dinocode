import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  BROWSER_TOOL_DEFINITIONS,
  DinocodeToolResultSchema,
  notImplementedResult,
  toAllProviderShapes,
  toClaudeTool,
  toCodexTool,
  toCursorTool,
} from "../tools/index.ts";
import { BrowserToolNameSchema } from "../shared/schemas.ts";

describe("browser tool definitions", () => {
  it("exposes one definition per canonical tool name", () => {
    const names = new Set(BROWSER_TOOL_DEFINITIONS.map((def) => def.name as string));
    const catalog = new Set(BrowserToolNameSchema.literals);
    expect(names).toEqual(catalog);
  });

  it("gives every tool a non-empty description", () => {
    for (const def of BROWSER_TOOL_DEFINITIONS) {
      expect(def.description.length).toBeGreaterThan(10);
    }
  });

  it("placeholder handlers return a structured not-implemented error", async () => {
    for (const def of BROWSER_TOOL_DEFINITIONS.slice(0, 3)) {
      const res = await def.handler({} as Record<string, unknown>, {
        traceId: "trace-12345678",
        now: () => new Date("2026-04-23T00:00:00Z"),
        invokeBrowser: async () => ({
          ok: false,
          code: "Internal",
          message: "not wired",
        }),
      });
      expect(res).toEqual(notImplementedResult(def.name));
    }
  });

  it("DinocodeToolResultSchema round-trips both branches", () => {
    const schema = DinocodeToolResultSchema(Schema.Struct({ finalUrl: Schema.String }));
    const ok = Schema.encodeUnknownSync(schema)({
      ok: true,
      data: { finalUrl: "https://x" },
    });
    const decodedOk = Schema.decodeUnknownSync(schema)(ok);
    expect(decodedOk).toEqual({ ok: true, data: { finalUrl: "https://x" } });

    const err = Schema.encodeUnknownSync(schema)({
      ok: false,
      code: "NavigationBlocked",
      message: "allowlist",
      hint: "ask user to allowlist this origin",
    });
    const decodedErr = Schema.decodeUnknownSync(schema)(err);
    expect(decodedErr).toEqual({
      ok: false,
      code: "NavigationBlocked",
      message: "allowlist",
      hint: "ask user to allowlist this origin",
    });
  });
});

describe("provider adapters", () => {
  const sample = BROWSER_TOOL_DEFINITIONS[0]!;

  it("produces a Codex function-tool shape", () => {
    const codex = toCodexTool(sample);
    expect(codex).toMatchObject({
      type: "function",
      function: {
        name: sample.name,
        description: sample.description,
      },
    });
    expect(codex.function.parameters).toBeTruthy();
  });

  it("produces a Claude tool shape", () => {
    const claude = toClaudeTool(sample);
    expect(claude).toMatchObject({
      name: sample.name,
      description: sample.description,
    });
    expect(claude.input_schema).toBeTruthy();
  });

  it("produces a Cursor tool shape", () => {
    const cursor = toCursorTool(sample);
    expect(cursor).toMatchObject({
      name: sample.name,
      description: sample.description,
    });
    expect(cursor.schema).toBeTruthy();
  });

  it("toAllProviderShapes bundles all three", () => {
    const bundle = toAllProviderShapes(sample);
    expect(Object.keys(bundle).sort()).toEqual(["claude", "codex", "cursor"]);
  });

  it("round-trips every definition through every adapter", () => {
    for (const def of BROWSER_TOOL_DEFINITIONS) {
      expect(toCodexTool(def).function.name).toBe(def.name);
      expect(toClaudeTool(def).name).toBe(def.name);
      expect(toCursorTool(def).name).toBe(def.name);
    }
  });
});
