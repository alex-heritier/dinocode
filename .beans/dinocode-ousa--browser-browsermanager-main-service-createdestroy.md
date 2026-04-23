---
# dinocode-ousa
title: 'Browser: BrowserManager main service (create/destroy tabs + layout sync)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

The authoritative main-process service that owns all browser tabs.

## Responsibilities

- Own a map of `BrowserTabId → BrowserTab` (each `BrowserTab` wraps a `WebContentsView`).
- Lifecycle: `createTab({ url, partitionId })`, `closeTab(id)`, `listTabs()`.
- Layout sync: renderer sends a rect via IPC (`browser.setTabBounds`); main calls `view.setBounds`. A ResizeObserver on the renderer-side placeholder drives this.
- Emits `tab:created`/`tab:updated`/`tab:closed`/`tab:crashed` events to renderer + server.
- Caps concurrent tabs (default 6) — `TOO_MANY_TABS` error beyond cap.

## Acceptance

- `packages/dinocode-browser/src/main/BrowserManager.ts` unit-tested for lifecycle + cap.
- Layout sync verified: resize the panel → view follows within one frame, no flicker > 16ms (manual smoke test documented).
- Zero direct `apps/desktop` imports; `apps/desktop/src/main.ts` gets a single `installDinocodeBrowser({ mainWindow })` call with `// dinocode-integration: browser lifecycle`.
