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
updated_at: 2026-04-23T05:47:48Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-r4ns
    - dinocode-cnnp
    - dinocode-jtbw
    - dinocode-gepm
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


---

## Why this bean exists (epic context)

The one authoritative main-process service every other runtime bean depends on. Its API shape determines how the rest of the subsystem composes.

## Dependencies

**Blocked by:**

- `dinocode-r4ns`
- `dinocode-cnnp`
- `dinocode-jtbw`
- `dinocode-gepm`

**Blocks:**

- `dinocode-qb85`
- `dinocode-tb6r`
- `dinocode-oxax`
- `dinocode-bs50`
- `dinocode-crea`
- `dinocode-ctrl`
- `dinocode-2lh1`
- `dinocode-fgw7`
- `dinocode-vkd6`
- `dinocode-6xeu`
- `dinocode-xtqg`
- `dinocode-b71p`
- `dinocode-aikp`
- `dinocode-yqtt`
- `dinocode-g5pr`
- `dinocode-6vwu`
- `dinocode-u1nj`

**Related:**

- `dinocode-yaan`

## Testing

### Unit tests

- Tab lifecycle: create/close/list; cap at 6.
- Layout sync: `setTabBounds` stores the rect; `view.setBounds` called accordingly.
- Event emission: `tab:*` events dispatched in order.
- Dispose idempotent.

### Integration / end-to-end

- Harness: open 6 tabs; close 2; open 2 more; assert state.
- Layout sync: resize the simulated window 10 times/second; assert `view.setBounds` called on each frame; no flicker.

### Manual QA

- Resize chat sidebar while a tab is visible; verify no gap/flicker at any speed.
- Open + close DevTools several times; verify bounds remain correct.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log every tab lifecycle event and layout-sync decision.

## Risks & mitigations

- **Layout flicker at rapid resize** — Throttle `setBounds` to `requestAnimationFrame`; measure with a perf test.

## Acceptance criteria (superset)

- [ ] Zero direct imports from `apps/**` in this module.
- [ ] Integration wire in `apps/desktop/src/main.ts` is a single line.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
