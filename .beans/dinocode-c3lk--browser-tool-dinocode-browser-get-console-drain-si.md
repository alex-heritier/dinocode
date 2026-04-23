---
# dinocode-c3lk
title: "Browser tool: dinocode_browser_get_console (drain since cursor)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-87ah
  - dinocode-yn5x
---

Expose the console ring buffer to the agent without duplicate delivery.

## Scope

- `dinocode_browser_get_console({ tabId, since?: cursor, level?: 'log'|'warn'|'error'|'any', limit?: number })` → `{ entries, nextCursor }`.
- Entries are the normalized `{ ts, level, text, stackTrace? }` from the ring buffer.
- Default limit 200, max 500.

## Acceptance

- Agent can call repeatedly with `since` to paginate.
- Level filtering works.

---

## Why this bean exists (epic context)

Agent-facing drain of the console buffer.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-yn5x`

**Blocks:**

- `dinocode-8t74`

**Related:**

- _None._

## Testing

### Unit tests

- Cursor pagination; level filter; limit enforcement.

### Integration / end-to-end

- Synthetic log flood; drain in pages; reassemble.

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
