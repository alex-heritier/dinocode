---
# dinocode-i71n
title: "Browser: runtime exception capture + optional toast"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-u1nj
  - dinocode-yn5x
---

Surface uncaught exceptions proactively.

## Scope

- Subscribe to `Runtime.exceptionThrown`.
- Default: add to console ring buffer with level `error` (already handled by previous bean for console.error — uncaught exceptions go through this path instead).
- User setting: "Toast on uncaught exception" (default off — too noisy during iterative dev).
- Agent tool `dinocode_browser_get_console` returns exceptions and console logs in the same unified stream.

## Acceptance

- Injected uncaught error appears in ring buffer within one event loop tick.
- Toggle behavior verified in a smoke test.

---

## Why this bean exists (epic context)

Uncaught exceptions are hugely useful for debugging but often not surfaced. Unify them into the same stream agents already consume.

## Dependencies

**Blocked by:**

- `dinocode-u1nj`
- `dinocode-yn5x`

**Blocks:**

- _None._

**Related:**

- `dinocode-hnyh`

## Testing

### Unit tests

- `exceptionThrown` → buffer entry shape.

### Integration / end-to-end

- Fixture with uncaught promise rejection + `throw`; both captured.

### Manual QA

- Toast toggle works; defaults to off.

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
