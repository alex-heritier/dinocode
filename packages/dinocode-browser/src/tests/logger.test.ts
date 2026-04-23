import { describe, expect, it, vi } from "vitest";

import {
  createLogger,
  createMemorySink,
  createTraceId,
  resolveLogLevelFromEnv,
} from "../logging/logger.ts";

const fixedNow = () => new Date("2026-04-23T00:00:00.000Z");

describe("structured logger", () => {
  it("emits records at or below the configured level", () => {
    const { sink, records } = createMemorySink();
    const logger = createLogger({ level: "info", sink, now: fixedNow });
    logger.error("a");
    logger.warn("b");
    logger.info("c");
    logger.debug("d");
    logger.trace("e");
    expect(records.map((r) => r.msg)).toEqual(["a", "b", "c"]);
    for (const r of records) expect(r.ts).toBe("2026-04-23T00:00:00.000Z");
  });

  it("propagates scope through child loggers", () => {
    const { sink, records } = createMemorySink();
    const logger = createLogger({
      level: "debug",
      sink,
      scope: { component: "browser" },
      now: fixedNow,
    });
    const child = logger.child({ traceId: "trace-1", tool: "navigate" });
    child.info({ msg: "request", phase: "request", data: { url: "https://x" } });
    child.child({ tabId: "tab-1" }).debug({ msg: "sub", data: { ok: true } });

    expect(records).toEqual([
      {
        ts: "2026-04-23T00:00:00.000Z",
        level: "info",
        msg: "request",
        component: "browser",
        traceId: "trace-1",
        tool: "navigate",
        phase: "request",
        data: { url: "https://x" },
      },
      {
        ts: "2026-04-23T00:00:00.000Z",
        level: "debug",
        msg: "sub",
        component: "browser",
        traceId: "trace-1",
        tool: "navigate",
        tabId: "tab-1",
        data: { ok: true },
      },
    ]);
  });

  it("redacts secret-bearing keys in data payloads", () => {
    const { sink, records } = createMemorySink();
    const logger = createLogger({ level: "info", sink, now: fixedNow });
    logger.info({
      msg: "request",
      data: {
        url: "https://x",
        headers: { Cookie: "abc", Authorization: "bearer y", accept: "json" },
      },
    });
    const headers = (records[0]!.data as { headers: Record<string, string> }).headers;
    expect(headers.Cookie).toBe("[REDACTED]");
    expect(headers.Authorization).toBe("[REDACTED]");
    expect(headers.accept).toBe("json");
  });

  it("recovers from a throwing sink with an error record", () => {
    const inner = vi.fn();
    let first = true;
    const sink = (record: { level: string }) => {
      if (first) {
        first = false;
        throw new Error("disk full");
      }
      inner(record);
    };
    const logger = createLogger({ level: "info", sink, now: fixedNow });
    logger.info("will throw");
    expect(inner).toHaveBeenCalledOnce();
    const record = inner.mock.calls[0]![0] as { msg: string };
    expect(record.msg).toBe("logger sink threw");
  });

  it("withLevel produces an independent logger at a new level", () => {
    const { sink, records } = createMemorySink();
    const logger = createLogger({ level: "error", sink, now: fixedNow });
    const verbose = logger.withLevel("trace");
    verbose.trace("ok");
    logger.trace("dropped");
    expect(records.map((r) => r.msg)).toEqual(["ok"]);
  });
});

describe("resolveLogLevelFromEnv", () => {
  it("maps DINOCODE_BROWSER_DEBUG variants to canonical levels", () => {
    expect(resolveLogLevelFromEnv(undefined)).toBe("info");
    expect(resolveLogLevelFromEnv("")).toBe("info");
    expect(resolveLogLevelFromEnv("1")).toBe("debug");
    expect(resolveLogLevelFromEnv("true")).toBe("debug");
    expect(resolveLogLevelFromEnv("0")).toBe("error");
    expect(resolveLogLevelFromEnv("verbose")).toBe("trace");
    expect(resolveLogLevelFromEnv("DEBUG")).toBe("debug");
    expect(resolveLogLevelFromEnv("wat", "warn")).toBe("warn");
  });
});

describe("createTraceId", () => {
  it("returns a non-empty, unique-looking string", () => {
    const a = createTraceId();
    const b = createTraceId();
    expect(a).toMatch(/-/);
    expect(a.length).toBeGreaterThanOrEqual(10);
    expect(a).not.toBe(b);
  });
});
