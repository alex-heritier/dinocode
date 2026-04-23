---
# dinocode-yn5x
title: 'Browser: console ring buffer + Runtime.consoleAPICalled capture'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-u1nj
---

Capture and retain the last N console messages per tab so the agent can fetch them without missing events.

## Scope

- `ConsoleRingBuffer` (default capacity 1000 entries per tab; override via config).
- Captures `Runtime.consoleAPICalled` + maps arg types (strings, numbers, JSON-serializable objects, error stacks).
- Stores `{ ts, level, args, stackTrace, executionContextId }`.
- Stream-emits to renderer (for the drawer in the next bean) and to the server (for agent tool).
- Cursor API: `drain(since: cursor) → { entries, nextCursor }` so the agent can poll without duplicates.

## Acceptance

- Unit tests cover level mapping, arg marshaling (incl. circular references → `[Circular]`), ring eviction.
- Integration test: inject 2k `console.log` calls → most recent 1000 retained.


---

## Why this bean exists (epic context)

The canonical store of console events per tab. Every agent-side console feature and every user-side error badge draws from this.

## Dependencies

**Blocked by:**

- `dinocode-u1nj`

**Blocks:**

- `dinocode-c3lk`
- `dinocode-hnyh`
- `dinocode-i71n`
- `dinocode-rfz5`

**Related:**

- _None._

## Testing

### Unit tests

- Ring eviction; arg marshalling (primitive/object/circular/error).
- Stacktrace normalisation.
- Cursor pagination correctness.

### Integration / end-to-end

- Fixture page emits 2000 console lines; last 1000 retained; pagination reassembles exactly.

### Manual QA

- Verbose test page; UI drawer shows accurate count.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Console flood degrades UI** — Default 1000 cap; soft-cap 10 000 configurable; over-cap fires a toast.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
