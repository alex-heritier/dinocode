---
# dinocode-bs50
title: 'Browser: multi-tab + tab strip'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-qb85
---

Give users a Chrome-like tab strip so they can have several pages open at once.

## Scope

- `TabStrip.tsx` renders one chip per tab with: title, favicon (from `page-favicon-updated`), close button, error badge (from Phase 2).
- `⌘T` new tab, `⌘W` close active, `⌘1..9` jump to tab N, `⌘⇧]`/`⌘⇧[` next/prev.
- Drag-to-reorder (dnd-kit consistent with board).
- Context menu: "Reload", "Duplicate", "Close others", "Close", "Open DevTools".

## Acceptance

- Up to 6 concurrent tabs supported; 7th returns `TOO_MANY_TABS` with a toast "Close a tab to open another".
- Tab reordering persists across reload.


---

## Why this bean exists (epic context)

Multi-tab unlocks parallel debugging flows (agent in one tab, user manually poking in another).

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-qb85`

**Blocks:**

- `dinocode-crea`
- `dinocode-g5pr`
- `dinocode-xtqg`
- `dinocode-ybmy`
- `dinocode-hnyh`

**Related:**

- _None._

## Testing

### Unit tests

- TabStrip state transitions; reordering persistence.

### Integration / end-to-end

- Open/close/drag-reorder; `⌘T/W/N`.

### Manual QA

- Daily-driver feel test.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] Cap of 6 enforced; seventh → toast + `TOO_MANY_TABS`.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
