/**
 * @dinocode/browser — public barrel.
 *
 * This package owns Dinocode's built-in browser: the Electron main-process
 * BrowserManager, the preload contextBridge, the renderer panel, shared
 * protocol schemas, and the agent tool handlers that drive an embedded
 * Chromium WebContentsView via the Chrome DevTools Protocol (CDP).
 *
 * Import subpaths directly when possible (main / preload / renderer / shared
 * / tools) so that process-specific dependencies (electron, react) don't leak
 * into runtimes that don't need them. This barrel exposes only process-
 * agnostic types and helpers.
 *
 * See docs/dinocode-browser.md for the architecture and phased plan.
 */

export * from "./shared/index.ts";
export * from "./logging/index.ts";
export * from "./security/index.ts";
export * from "./config/index.ts";
export * from "./artifacts/index.ts";
export * from "./devserver/index.ts";
export * from "./capture/index.ts";
