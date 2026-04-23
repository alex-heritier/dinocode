---
# dinocode-6os6
title: 'Browser: ''Agent is driving'' banner + take-over flow'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-kww9
    - dinocode-34kt
    - dinocode-cbcb
---

Make it visible and reversible when the agent is manipulating the browser.

## Scope

- When any interaction tool (Phase 4) runs, set `tab.agentActive = true` for the tab's duration-of-action (+ 1s debounce after the last action).
- Render a non-blocking banner across the top of the embedded view: "Agent is using this tab" + "Take over" button.
- "Take over" cancels any in-flight action and posts `agent.browserTakenOver(tabId)` to the server → agent receives a `PERMISSION_DENIED` on next call for that tab until user re-grants.
- Banner auto-dismisses 1s after the agent stops acting.

## Acceptance

- Agent cannot steal input while a user is actively typing (input focus + recent user activity → interaction tools return `USER_ACTIVE` with a hint).
- "Take over" verified in an integration test.


---

## Why this bean exists (epic context)

Makes agent control visible and interruptible.

## Dependencies

**Blocked by:**

- `dinocode-kww9`
- `dinocode-34kt`
- `dinocode-cbcb`

**Blocks:**

- `dinocode-te2e`

**Related:**

- _None._

## Testing

### Unit tests

- `agentActive` debouncing; take-over state machine.

### Integration / end-to-end

- Driving banner appears during click tool; 'Take over' disables until user re-grants.

### Manual QA

- Drive a page; hit Take over mid-action; verify cancel.

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
