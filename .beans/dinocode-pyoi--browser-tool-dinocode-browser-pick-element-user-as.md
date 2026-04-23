---
# dinocode-pyoi
title: "Browser tool: dinocode_browser_pick_element (user-assisted crosshair)"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-cbcb
  - dinocode-qb85
  - dinocode-j4ve
---

Give the user a one-click way to hand the agent a selector for the element they care about.

## Scope

- When `dinocode_browser_pick_element({ tabId, prompt?: string })` is invoked, the browser panel shows a crosshair overlay ("Click an element to point the agent at it"). User clicks → overlay captures target → returns a stable selector chain (id → data-testid → class+nth-child → generated robust selector).
- Overlay is rendered in main via `Overlay.highlightNode` or an injected content script (whichever yields cleaner selection).
- Cancelling (Esc) returns `USER_CANCELLED`.

## Acceptance

- Selector returned works in `dinocode_browser_query_selector` without modification.
- E2E: user picks a button on localhost:3000 → agent clicks it via the returned selector.

---

## Why this bean exists (epic context)

User-assisted selector capture — a killer feature for collaboration.

## Dependencies

**Blocked by:**

- `dinocode-cbcb`
- `dinocode-qb85`
- `dinocode-j4ve`

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- State machine for start/confirm/cancel.

### Integration / end-to-end

- Harness picks a known element; returned selector resolves to the same element.

### Manual QA

- Pick on a live web app; verify resulting selector is stable.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
