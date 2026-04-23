---
# dinocode-er1u
title: 'Browser: zoom controls (⌘+/⌘-/⌘0)'
status: todo
type: task
priority: low
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-qb85
    - dinocode-u2p2
    - dinocode-crea
---

## Why this bean exists

Table-stakes. Pages need to be readable at different zooms; dev flows often require zooming in on specific elements. Accessible by default.

## Background

`webContents.setZoomLevel(n)` and `setZoomFactor(n)` give us the full range. Per-tab zoom stored in the tab state.

## In scope

- Keybindings `⌘+`, `⌘-`, `⌘0` per active tab.
- Per-tab zoom persisted across restart.
- Status indicator in address bar when zoom ≠ 100%.

## Out of scope

- Per-origin zoom memory (defer).

## Subtasks

- [ ] Zoom module + tests.
- [ ] Status indicator UI.

## Dependencies

**Blocked by:**

- `dinocode-qb85` — panel-skeleton
- `keybinding-scope` (UNRESOLVED — fix before commit)
- `dinocode-crea` — persist-tabs

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Zoom level state transitions; persistence.

### Integration / end-to-end

- Navigate, zoom in, reload; assert zoom persists.

### Manual QA script

- Pinch-zoom trackpad gesture and keyboard both work.

## Logging & observability

- Log zoom changes at `debug` level.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Chrome-equivalent zoom UX.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
