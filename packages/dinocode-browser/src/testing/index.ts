/**
 * In-process test harness for the built-in browser subsystem.
 *
 * The harness is deliberately zero-Electron — it provides the shared
 * `FakePage`, `TinyServer`, and `TraceRecorder` primitives that every
 * browser-package test composes. When the real main-process
 * `BrowserManager` lands (`dinocode-ousa`), it plugs into the same
 * `withBrowser` entry point by supplying a `managerFactory`.
 *
 * Consumers usually only need `withBrowser`:
 *
 *   import { withBrowser, FIXTURES } from "@dinocode/browser/testing";
 *
 *   it("captures console entries", async () => {
 *     await withBrowser({ initialTab: { tabId: "tab-1" } }, async ({ openPage }) => {
 *       const page = openPage({ tabId: "tab-2", url: "/console" });
 *       page.pushConsole({ level: "error", text: "boom" });
 *       const hit = await page.expectConsole({ level: "error" }).within(1000);
 *       expect(hit.text).toBe("boom");
 *     });
 *   });
 */

export * from "./fakePage.ts";
export * from "./fixtures.ts";
export * from "./harness.ts";
export * from "./tinyServer.ts";
export * from "./trace.ts";
