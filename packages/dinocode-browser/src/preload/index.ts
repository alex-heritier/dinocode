/**
 * Preload entry for the built-in browser.
 *
 * Runs in Electron's preload context with `contextBridge`. Exposes a narrow,
 * typed API surface for the renderer under `window.dinocodeBrowser`.
 *
 * The real wiring lives in {@link exposeDinocodeBrowserBridge}; this file is
 * just a barrel so `apps/desktop/src/preload.ts` can do:
 *
 *   // dinocode-integration: dinocode-browser preload bridge.
 *   import { exposeDinocodeBrowserBridge } from "@dinocode/browser/preload";
 *   import { contextBridge, ipcRenderer } from "electron";
 *   exposeDinocodeBrowserBridge({ contextBridge, ipcRenderer });
 *
 * and stay under the 80-line budget.
 */

export * from "./bridge.ts";
