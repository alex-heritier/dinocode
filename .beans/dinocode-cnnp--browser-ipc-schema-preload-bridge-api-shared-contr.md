---
# dinocode-cnnp
title: 'Browser: IPC schema + preload bridge API (shared contracts)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Lock down the IPC shapes before any renderer/main code exists so both sides build against a stable API.

## Scope

- Effect `Schema` definitions in `packages/dinocode-browser/src/shared/schemas.ts` for every IPC payload:
  - `BrowserTabId`, `BrowserTabState`, `BrowserNavigationEvent`, `BrowserConsoleEntry`, `BrowserNetworkEntry`, `BrowserToolRequest`/`Response`, `BrowserActionLogEntry`.
- Preload API (`window.dinocodeBrowser`) exposed via `contextBridge.exposeInMainWorld` with typed wrappers around `ipcRenderer.invoke` and `ipcRenderer.on`.
- `packages/dinocode-contracts` re-exports the schemas for the server-side tool handlers.

## Acceptance

- Types round-trip: `Schema.decode` ↔ `Schema.encode` tested.
- No `any` anywhere in the bridge API.
- Preload file stays under 80 lines (pure wiring, zero logic).
- Added under `dinocode-integration: browser` comment in `apps/desktop/src/preload.ts` once the real exposer ships in Phase 1.
