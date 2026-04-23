---
# dinocode-w0qv
title: "Browser tool: dinocode_browser_open / list_tabs / close"
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

The foundational tools for tab lifecycle from the agent's side.

## Scope

- `dinocode_browser_open({ projectId, url, reuseExistingTab?: boolean })` → `{ tabId, title, url }`.
- `dinocode_browser_list_tabs({ projectId })` → `{ tabs: [{ tabId, url, title, errorCount, networkCount }] }`.
- `dinocode_browser_close({ tabId })` → `{ ok }`.
- Allowlist applied on `open`.

## Acceptance

- Tools callable from a headless test harness.
- Error codes: `NAVIGATION_BLOCKED`, `TOO_MANY_TABS`, `NOT_FOUND`.

---

## Why this bean exists (epic context)

Lifecycle primitive for agent-driven tabs.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-ousa`
- `dinocode-sdqj`

**Blocks:**

- `dinocode-8xd5`
- `dinocode-8t74`

**Related:**

- _None._

## Testing

### Unit tests

- Input/output schema; allowlist enforcement.

### Integration / end-to-end

- Open/list/close cycle from a harness session.

### Manual QA

- Agent session can open localhost.

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
