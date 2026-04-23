/**
 * Dinocode browser preload bridge. Runs in Electron's preload context and
 * exposes `window.dinocodeBrowser` via `contextBridge.exposeInMainWorld`.
 * Pure wiring — no business logic. Keep this file ≤ 80 lines.
 */

import type {
  BrowserEventEnvelope,
  BrowserInvokeEnvelope,
  BrowserToolResponse,
} from "../shared/schemas.ts";

export const BrowserIpcChannels = {
  invoke: "dinocode.browser.invoke",
  subscribe: "dinocode.browser.subscribe",
  unsubscribe: "dinocode.browser.unsubscribe",
  event: "dinocode.browser.event",
} as const;

export type BrowserIpcChannel = (typeof BrowserIpcChannels)[keyof typeof BrowserIpcChannels];

export interface BrowserSubscription {
  readonly id: string;
  readonly unsubscribe: () => void;
}

export interface DinocodeBrowserApi {
  readonly invoke: (envelope: BrowserInvokeEnvelope) => Promise<BrowserToolResponse>;
  readonly subscribe: (handler: (event: BrowserEventEnvelope) => void) => BrowserSubscription;
}

type IpcListener = (event: unknown, ...args: unknown[]) => void;

export interface BrowserBridgeDeps {
  readonly contextBridge: {
    readonly exposeInMainWorld: (key: string, api: unknown) => void;
  };
  readonly ipcRenderer: {
    readonly invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    readonly on: (channel: string, listener: IpcListener) => void;
    readonly removeListener: (channel: string, listener: IpcListener) => void;
  };
}

export const DINOCODE_BROWSER_WINDOW_KEY = "dinocodeBrowser";

export const exposeDinocodeBrowserBridge = (deps: BrowserBridgeDeps): void => {
  const api: DinocodeBrowserApi = {
    invoke: (envelope) =>
      deps.ipcRenderer.invoke(BrowserIpcChannels.invoke, envelope) as Promise<BrowserToolResponse>,
    subscribe: (handler) => {
      const listener: IpcListener = (_event, payload) => handler(payload as BrowserEventEnvelope);
      deps.ipcRenderer.on(BrowserIpcChannels.event, listener);
      return {
        id: crypto.randomUUID(),
        unsubscribe: () => deps.ipcRenderer.removeListener(BrowserIpcChannels.event, listener),
      };
    },
  };
  deps.contextBridge.exposeInMainWorld(DINOCODE_BROWSER_WINDOW_KEY, api);
};
