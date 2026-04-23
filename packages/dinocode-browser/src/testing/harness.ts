/**
 * `withBrowser` — the composition entry point for every browser
 * subsystem test.
 *
 * This harness is deliberately process-local (no Electron dependency)
 * so the browser-package unit tests stay fast and hermetic. The
 * harness gives every test:
 *
 *   • A `FakePage` per tab, with a DSL for pushing console / network /
 *     navigation events and waiting for them with timeouts.
 *   • A `TinyServer` serving canned fixtures (or whatever the caller
 *     passes). Bound to `127.0.0.1:0` so CI runners cannot collide.
 *   • A `TraceRecorder` that captures every harness step and dumps it
 *     to stderr on test failure.
 *   • Auto-cleanup — the server closes and all pages are marked
 *     `closed` even when the test body throws.
 *
 * The real Electron-in-process path lands with the BrowserManager bean
 * (`dinocode-ousa`); `withBrowser` is written so it can be extended to
 * accept an optional `managerFactory` that boots a real manager and
 * returns the same `{ manager, tab, cdp, ... }` shape.
 */

import { createTraceId } from "../logging/index.ts";
import { createFakePage, type FakePage, type FakePageInit } from "./fakePage.ts";
import { standardFixtures } from "./fixtures.ts";
import { startTinyServer, type TinyServerHandle, type TinyServerOptions } from "./tinyServer.ts";
import { createTraceRecorder, type TraceRecorder } from "./trace.ts";

export interface HarnessHandle {
  readonly trace: TraceRecorder;
  readonly server: TinyServerHandle;
  readonly pages: ReadonlyArray<FakePage>;
  readonly openPage: (init: FakePageInit) => FakePage;
  readonly closePage: (tabId: string) => void;
}

export interface WithBrowserOptions {
  readonly fixtures?: TinyServerOptions["fixtures"];
  readonly includeStandardFixtures?: boolean;
  readonly initialTab?: FakePageInit;
  /** Override the trace id (default: newly minted per call). */
  readonly traceId?: string;
}

/**
 * Run `fn` with a fully-wired harness and tear everything down on the
 * way out. Any error thrown by `fn` is rethrown *after* the trace has
 * been printed to stderr so reviewers can see the exact sequence.
 */
export const withBrowser = async <T>(
  options: WithBrowserOptions,
  fn: (handle: HarnessHandle) => T | Promise<T>,
): Promise<T> => {
  const traceId = options.traceId ?? createTraceId();
  const trace = createTraceRecorder({ traceId });

  const includeStandard = options.includeStandardFixtures ?? true;
  const fixtures = {
    ...(includeStandard ? standardFixtures() : {}),
    ...(options.fixtures ?? {}),
  };

  const server = await startTinyServer({ fixtures });
  trace.record("server.start", { baseUrl: server.baseUrl });

  const pages: FakePage[] = [];
  const openPage = (init: FakePageInit): FakePage => {
    const p = createFakePage(init);
    pages.push(p);
    trace.record("page.open", { tabId: init.tabId, url: init.url ?? "about:blank" });
    return p;
  };

  const closePage = (tabId: string) => {
    const page = pages.find((p) => p.tabId === tabId);
    if (!page) return;
    page.close();
    trace.record("page.close", { tabId });
  };

  if (options.initialTab) openPage(options.initialTab);

  const handle: HarnessHandle = {
    trace,
    server,
    pages,
    openPage,
    closePage,
  };

  try {
    return await trace.flushOnFailure(() => fn(handle));
  } finally {
    for (const page of pages) page.close();
    await server.close().catch((err) => {
      trace.record("server.close.error", { error: (err as Error).message });
    });
    trace.record("harness.cleanup", { pages: pages.length });
  }
};
