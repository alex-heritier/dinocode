---
# dinocode-w19p
title: 'Browser tool: dinocode_browser_get_network (requests + optional body)'
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
    - dinocode-ive4
---

Expose the network ring buffer to the agent.

## Scope

- `dinocode_browser_get_network({ tabId, since?: cursor, limit?: number, includeBody?: boolean, urlFilter?: regex })` → `{ entries, nextCursor }`.
- Entries contain `{ id, method, url, status, mimeType, timing, initiator, failureReason?, reqHeaders, resHeaders }`.
- If `includeBody`, body capture must have been enabled on the tab; bodies > 1 MiB return a path instead of inline content.
- `dinocode_browser_get_network_body({ tabId, requestId })` retrieves a single body.

## Acceptance

- Regex URL filter works.
- Requests-without-response (in-flight) show `status: null`.


---

## Why this bean exists (epic context)

Agent-facing drain of the network buffer.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-ive4`

**Blocks:**

- `dinocode-8t74`

**Related:**

- _None._

## Testing

### Unit tests

- Filter regex; body-include opt-in behaviour.

### Integration / end-to-end

- Request wave; inspect summary; fetch 3 bodies by id.

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
