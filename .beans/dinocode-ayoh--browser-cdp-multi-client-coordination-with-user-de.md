---
# dinocode-ayoh
title: "Browser: CDP multi-client coordination with user DevTools"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-7-later
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-u1nj
  - dinocode-tb6r
---

Hard-harden the shared-CDP case where both our `CdpAdapter` and Chrome DevTools are attached.

## Scope

- Document observed behavior differences across Chromium versions.
- Guard against our subscriptions being silently dropped when DevTools toggles.
- Auto-resubscribe on `Debugger.paused`/`Debugger.resumed` cycles triggered by user breakpoints.
- Regression tests using the Phase 0 spike harness.

## Acceptance

- Opening DevTools, hitting a breakpoint, resuming — our ring buffers keep capturing without gaps.
- Documented limitations where multi-client is fundamentally lossy (if any).

---

## Why this bean exists (epic context)

Hardens the DevTools + agent coexistence story.

## Dependencies

**Blocked by:**

- `dinocode-u1nj`
- `dinocode-tb6r`

**Blocks:**

- _None._

**Related:**

- `dinocode-27vx`

## Testing

### Unit tests

- Subscription audit: after DevTools toggle, every subscription re-verified.

### Integration / end-to-end

- Long-running session with repeated DevTools toggles; zero missed events.

### Manual QA

- Real debugging session with breakpoints; verify buffers keep capturing.

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
