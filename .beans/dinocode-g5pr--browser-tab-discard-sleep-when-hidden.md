---
# dinocode-g5pr
title: 'Browser: tab discard / sleep when hidden'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
    - perf
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-bs50
---

## Why this bean exists

Each tab is a full renderer process. Leaving 6 open can eat 1–2 GB. Discarding (destroying the renderer while keeping metadata) reclaims memory with a small re-load cost when the user returns.

## Background

Electron doesn't have a first-class discard API but we can rebuild the `WebContentsView` on demand while keeping `{ url, title, scrollPosition, zoom }` in state. Heuristics: discard tabs hidden for > 15 minutes.

## In scope

- `TabDiscardPolicy` with configurable idle threshold.
- `discardTab(id)` / `reviveTab(id)` in `BrowserManager`.
- Visual indicator on discarded tab chips.
- Automatic revival on focus.

## Out of scope

- Memory-pressure-driven discard.

## Subtasks

- [ ] Policy + discard/revive paths + UI + tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-bs50` — multi-tab

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Policy timing; state transitions; event emission.

### Integration / end-to-end

- Open 4 tabs; advance simulated time 20 min; assert 3 inactive tabs discarded; switch to one; assert restored content.

### Manual QA script

- Open 5 tabs; leave for 20 min; verify memory drops.

## Logging & observability

- Log discard + revive with `{ traceId, tabId, reason, savedBytes? }`.

## Risks & mitigations

- **Lost scroll position on revival** — Record scroll pre-discard via CDP `Runtime.evaluate`; restore on revival.

## Acceptance criteria

- [ ] Measurable memory reclaim in the integration test.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
