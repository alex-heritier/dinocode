---
# dinocode-yn5x
title: "Browser: console ring buffer + Runtime.consoleAPICalled capture"
status: in_progress
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

## Progress

- Landed the pure data layer under `packages/dinocode-browser/src/capture/`:
  - `ringBuffer.ts` — bounded FIFO with monotonic `seq` cursor that never resets across evictions. `drain({ since, limit })` reports `droppedBefore` so clients can detect gap windows even when they fall behind.
  - `marshalArg.ts` — argument marshaller with circular-safe JSON, error-stack extraction, primitive round-tripping, RegExp/Date/Function formatting, and a configurable string ceiling (default 4 KiB).
  - `consoleBuffer.ts` — `ConsoleRingBuffer` (capacity **1000**) with `ingestConsoleApiCall` and `ingestException`. Level strings normalise the way CDP emits them (`warning→warn`, `assert→error`, `dir/dirxml/table→log`). Each entry carries `{ ts, level, origin, args[], stackTrace[], executionContextId?, url? }`.
- Public surface: `@dinocode/browser/capture` subpath. Consumers get `createConsoleRingBuffer`, `DEFAULT_CONSOLE_CAPACITY`, `CONSOLE_LEVELS_ALL`, `isConsoleLevel`, and all entry types.
- **Tests**: 24 new assertions across `ringBuffer.test.ts`, `marshalArg.test.ts`, and `consoleBuffer.test.ts` cover eviction, pagination, circular references, level normalisation, exception capture, and cursor correctness. Total suite: **142/142 green**.
- **Remaining (blocked on `dinocode-u1nj`)**: the CDP adapter will call `ingestConsoleApiCall` on `Runtime.consoleAPICalled` and `ingestException` on `Runtime.exceptionThrown`. This bean is structured so that wiring is a ~20-line change plus the existing tests.

## Subtasks

- [x] Pure data module (ring buffer + marshalling + eviction + pagination).
- [x] Unit tests for level mapping, arg marshalling (incl. circular references → `[Circular]`), ring eviction.
- [ ] Wire `Runtime.consoleAPICalled` + `Runtime.exceptionThrown` subscriptions in the CDP adapter (`dinocode-u1nj`).
- [ ] Stream-emit to renderer and to server for the agent tool (`dinocode-c3lk` + `dinocode-hnyh`).
- [ ] Integration test: inject 2k `console.log` calls → most recent 1000 retained (needs live Electron; `dinocode-yuwy`).
