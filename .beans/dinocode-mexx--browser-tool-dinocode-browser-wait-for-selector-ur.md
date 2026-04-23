---
# dinocode-mexx
title: 'Browser tool: dinocode_browser_wait_for (selector / url / console / network-idle)'
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
    - dinocode-yn5x
    - dinocode-ive4
---

Robust waiters so agents don't hardcode `sleep` and don't hang.

## Scope

- `dinocode_browser_wait_for({ tabId, condition, timeoutMs? })` where `condition` is one of:
  - `{ type: 'selector', selector, state: 'visible'|'attached'|'detached'|'hidden' }`
  - `{ type: 'url', pattern: regex }`
  - `{ type: 'console', pattern: regex, level? }`
  - `{ type: 'network', urlPattern: regex, status? }`
  - `{ type: 'networkIdle', idleMs: number, maxInflight: number }`
- Default 10s timeout, max 60s.

## Acceptance

- Each condition tested.
- Timeout returns `{ ok: false, code: 'TIMEOUT', hint: '<what we last observed>' }`.


---

## Why this bean exists (epic context)

Keeps agent loops robust against async page state.

## Dependencies

**Blocked by:**

- `dinocode-cbcb`
- `dinocode-yn5x`
- `dinocode-ive4`

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Each condition type; timeout behaviour; hint includes last-observed state.

### Integration / end-to-end

- Selector, URL, console, network, network-idle fixtures each tested.

### Manual QA

- _None._

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
