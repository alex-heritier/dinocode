---
# dinocode-kww9
title: "Browser tool: dinocode_browser_click / hover"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-cbcb
  - dinocode-yne5
---

Simulated mouse input for the agent.

## Scope

- `dinocode_browser_click({ tabId, ref | selector | xy, button?, modifiers?, clickCount? })` → `{ ok, navigationOccurred }`.
- Uses `Input.dispatchMouseEvent` for precise control (not `element.click()`).
- Auto-scrolls the element into view before clicking.
- `dinocode_browser_hover({ tabId, ref | selector | xy })` → `{ ok }`.
- Rejects clicks on offscreen / disabled / detached elements with `NOT_INTERACTABLE`.

## Acceptance

- Clicks work for buttons, links, labels, checkboxes, native date pickers (for the visible cases).
- Navigation-causing clicks waited on via `Page.frameStoppedLoading`.

---

## Why this bean exists (epic context)

Mouse input via CDP dispatchMouseEvent — not element.click().

## Dependencies

**Blocked by:**

- `dinocode-cbcb`
- `dinocode-yne5`

**Blocks:**

- `dinocode-6os6`

**Related:**

- `dinocode-te2e`

## Testing

### Unit tests

- Offscreen scroll-into-view; disabled rejection.

### Integration / end-to-end

- Click a link; nav occurs; assert returned `navigationOccurred:true`.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Target detached mid-click** — Re-resolve + retry once; then error.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
