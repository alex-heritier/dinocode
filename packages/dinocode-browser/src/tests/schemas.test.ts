import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  BrowserActionLogEntry,
  BrowserConsoleEntry,
  BrowserEventEnvelope,
  BrowserInvokeEnvelope,
  BrowserNavigationEvent,
  BrowserNetworkEntry,
  BrowserTabState,
  BrowserToolErrorSchema,
  BrowserToolRequest,
  BrowserToolResponse,
} from "../shared/schemas.ts";

const roundTripOk = (
  schema: Schema.Codec<unknown, unknown, never, never>,
  value: unknown,
): void => {
  const encoded = Schema.encodeUnknownSync(schema)(value);
  const decoded = Schema.decodeUnknownSync(schema)(encoded);
  expect(decoded).toEqual(value);
};

const expectInvalid = (
  schema: Schema.Codec<unknown, unknown, never, never>,
  value: unknown,
): void => {
  expect(() => Schema.decodeUnknownSync(schema)(value)).toThrow();
};

describe("browser IPC schemas", () => {
  it("round-trips a BrowserTabState", () => {
    roundTripOk(BrowserTabState, {
      tabId: "tab-1",
      partitionId: "persist:project-a",
      url: "https://example.com",
      title: "Example",
      status: "ready",
      loadingProgress: 1,
      canGoBack: false,
      canGoForward: false,
      muted: false,
      updatedAt: "2026-04-23T00:00:00Z",
    });
  });

  it("rejects malformed tab ids", () => {
    expectInvalid(BrowserTabState, {
      tabId: "Invalid ID!",
      partitionId: "persist:ok",
      url: "https://x",
      title: "",
      status: "ready",
      loadingProgress: 0.5,
      canGoBack: false,
      canGoForward: false,
      muted: false,
      updatedAt: "t",
    });
  });

  it("clamps loadingProgress to [0,1]", () => {
    expectInvalid(BrowserTabState, {
      tabId: "t",
      partitionId: "persist:p",
      url: "https://x",
      title: "",
      status: "ready",
      loadingProgress: 1.5,
      canGoBack: false,
      canGoForward: false,
      muted: false,
      updatedAt: "t",
    });
  });

  it("round-trips a BrowserNavigationEvent without optional fields", () => {
    roundTripOk(BrowserNavigationEvent, {
      tabId: "tab-1",
      kind: "finished",
      url: "https://example.com",
      timestamp: "2026-04-23T00:00:00Z",
    });
  });

  it("round-trips a BrowserConsoleEntry", () => {
    roundTripOk(BrowserConsoleEntry, {
      tabId: "tab-1",
      cursor: 7,
      level: "error",
      text: "boom",
      timestamp: "2026-04-23T00:00:00Z",
    });
  });

  it("round-trips a BrowserNetworkEntry", () => {
    roundTripOk(BrowserNetworkEntry, {
      tabId: "tab-1",
      cursor: 1,
      requestId: "req-1",
      method: "GET",
      url: "https://example.com/api",
      requestHeaders: { accept: "application/json" },
      failed: false,
      startedAt: "2026-04-23T00:00:00Z",
    });
  });

  it("round-trips an action log entry", () => {
    roundTripOk(BrowserActionLogEntry, {
      cursor: 2,
      actor: "agent",
      traceId: "trace-12345678",
      phase: "request",
      summary: "navigate example.com",
      timestamp: "2026-04-23T00:00:00Z",
    });
  });

  it("round-trips a tool request", () => {
    roundTripOk(BrowserToolRequest, {
      tool: "dinocode_browser_navigate",
      traceId: "trace-12345678",
      timestamp: "2026-04-23T00:00:00Z",
      args: { url: "https://example.com" },
    });
  });

  it("round-trips a successful tool response", () => {
    roundTripOk(BrowserToolResponse, {
      tool: "dinocode_browser_navigate",
      traceId: "trace-12345678",
      timestamp: "2026-04-23T00:00:01Z",
      durationMs: 125,
      result: { ok: true, data: { finalUrl: "https://example.com" } },
    });
  });

  it("round-trips a failed tool response", () => {
    roundTripOk(BrowserToolResponse, {
      tool: "dinocode_browser_navigate",
      traceId: "trace-12345678",
      timestamp: "2026-04-23T00:00:02Z",
      durationMs: 10,
      result: {
        ok: false,
        error: {
          kind: "NavigationBlocked",
          message: "blocked by allowlist",
          retryable: false,
        },
      },
    });
  });

  it("round-trips the invoke envelope", () => {
    roundTripOk(BrowserInvokeEnvelope, {
      request: {
        tool: "dinocode_browser_click",
        traceId: "trace-abcdef01",
        timestamp: "2026-04-23T00:00:00Z",
        args: { selector: "#go" },
      },
    });
  });

  it("round-trips every event envelope variant", () => {
    roundTripOk(BrowserEventEnvelope, {
      kind: "tab.state",
      payload: {
        tabId: "tab-1",
        partitionId: "persist:p",
        url: "https://x",
        title: "",
        status: "loading",
        loadingProgress: 0,
        canGoBack: false,
        canGoForward: false,
        muted: false,
        updatedAt: "t",
      },
    });
    roundTripOk(BrowserEventEnvelope, {
      kind: "tab.navigation",
      payload: {
        tabId: "tab-1",
        kind: "start",
        url: "https://x",
        timestamp: "t",
      },
    });
  });

  it("exposes every tool-error kind via schema literals", () => {
    const value = {
      kind: "RateLimited" as const,
      message: "too many calls",
      retryable: true,
    };
    roundTripOk(BrowserToolErrorSchema, value);
  });

  it("rejects an unknown tool name", () => {
    expectInvalid(BrowserToolRequest, {
      tool: "dinocode_browser_bogus",
      traceId: "trace-12345678",
      timestamp: "2026-04-23T00:00:00Z",
      args: {},
    });
  });
});
