import { describe, expect, it, vi } from "vitest";

import {
  BrowserIpcChannels,
  DINOCODE_BROWSER_WINDOW_KEY,
  exposeDinocodeBrowserBridge,
} from "../preload/bridge.ts";
import type { BrowserBridgeDeps, DinocodeBrowserApi } from "../preload/bridge.ts";
import type { BrowserInvokeEnvelope, BrowserToolResponse } from "../shared/schemas.ts";

const makeDeps = () => {
  const exposed: { key?: string; api?: unknown } = {};
  const invoke = vi.fn(async (_channel: string, _payload: unknown) => ({
    tool: "dinocode_browser_navigate" as const,
    traceId: "trace-12345678",
    timestamp: "2026-04-23T00:00:00Z",
    durationMs: 5,
    result: { ok: true as const, data: { finalUrl: "https://x" } },
  }));
  const listeners = new Map<string, (event: unknown, ...args: unknown[]) => void>();
  const on = vi.fn((channel: string, listener: (event: unknown, ...args: unknown[]) => void) => {
    listeners.set(channel, listener);
  });
  const removeListener = vi.fn((channel: string) => {
    listeners.delete(channel);
  });
  const deps: BrowserBridgeDeps = {
    contextBridge: {
      exposeInMainWorld: (key, api) => {
        exposed.key = key;
        exposed.api = api;
      },
    },
    ipcRenderer: { invoke, on, removeListener },
  };
  return { deps, exposed, invoke, on, removeListener, listeners };
};

describe("preload bridge", () => {
  it("exposes the API on the expected window key", () => {
    const { deps, exposed } = makeDeps();
    exposeDinocodeBrowserBridge(deps);
    expect(exposed.key).toBe(DINOCODE_BROWSER_WINDOW_KEY);
    expect(exposed.key).toBe("dinocodeBrowser");
  });

  it("routes invoke() through the correct ipc channel", async () => {
    const { deps, exposed, invoke } = makeDeps();
    exposeDinocodeBrowserBridge(deps);
    const api = exposed.api as DinocodeBrowserApi;
    const envelope: BrowserInvokeEnvelope = {
      request: {
        tool: "dinocode_browser_navigate",
        traceId: "trace-abcdef01",
        timestamp: "2026-04-23T00:00:00Z",
        args: { url: "https://example.com" },
      },
    };
    const response = await api.invoke(envelope);
    expect(invoke).toHaveBeenCalledWith(BrowserIpcChannels.invoke, envelope);
    const narrowed: BrowserToolResponse = response;
    expect(narrowed.result.ok).toBe(true);
  });

  it("wires subscribe() through the event channel and cleans up", () => {
    const { deps, exposed, on, removeListener, listeners } = makeDeps();
    exposeDinocodeBrowserBridge(deps);
    const api = exposed.api as DinocodeBrowserApi;
    const handler = vi.fn();
    const sub = api.subscribe(handler);
    expect(on).toHaveBeenCalledWith(BrowserIpcChannels.event, expect.any(Function));
    expect(listeners.has(BrowserIpcChannels.event)).toBe(true);

    const listener = listeners.get(BrowserIpcChannels.event)!;
    listener(null, {
      kind: "tab.state",
      payload: {
        tabId: "tab-1",
        partitionId: "persist:p",
        url: "https://x",
        title: "",
        status: "ready",
        loadingProgress: 1,
        canGoBack: false,
        canGoForward: false,
        muted: false,
        updatedAt: "t",
      },
    });
    expect(handler).toHaveBeenCalledOnce();

    sub.unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(BrowserIpcChannels.event, expect.any(Function));
  });
});
