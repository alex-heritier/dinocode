---
# dinocode-t2l9
title: "Browser tool: dinocode_browser_navigate / reload / get_url"
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
  - dinocode-ousa
  - dinocode-sdqj
---

Cross-tab navigation primitives for the agent.

## Scope

- `dinocode_browser_navigate({ tabId, url })` — allowlist applied; waits for `Page.frameStoppedLoading` before returning `{ url, title, statusCode }`.
- `dinocode_browser_reload({ tabId, bypassCache?: boolean })`.
- `dinocode_browser_get_url({ tabId })` → `{ url, title, loadState: 'loading'|'complete'|'failed' }`.

## Acceptance

- `navigate` returns after load with HTTP status surfaced.
- `reload` bypass-cache verified via a `Cache-Control: max-age` fixture.

---

## Why this bean exists (epic context)

Cross-tab navigation primitive.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-ousa`
- `dinocode-sdqj`

**Blocks:**

- `dinocode-8t74`

**Related:**

- _None._

## Testing

### Unit tests

- Status code propagation; cache bypass option.

### Integration / end-to-end

- Navigate to 404, assert `statusCode=404`; reload; back/forward.

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
