---
# dinocode-bkmr
title: 'Browser: structured tool errors + retry policy docs'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-87ah
---

Tight error taxonomy so agents can self-correct.

## Scope

- Error codes canonicalized in `packages/dinocode-browser/src/shared/errors.ts`:
  - `NAVIGATION_BLOCKED` — allowlist.
  - `TAB_CRASHED` — renderer gone.
  - `LOAD_FAILED` — HTTP/network error.
  - `EVALUATE_ERROR` — JS threw.
  - `TIMEOUT` — waiter expired.
  - `NOT_FOUND` — selector / tabId absent.
  - `NOT_INTERACTABLE` — element offscreen/disabled/detached.
  - `USER_ACTIVE` — user currently interacting.
  - `PERMISSION_DENIED` — user revoked agent control.
  - `TOO_MANY_TABS` — cap reached.
  - `INTERNAL` — unknown.
- Each error carries a structured `hint` the agent can use.
- `docs/dinocode-browser.md` has a "Retry-safe vs. fatal" table.

## Acceptance

- Every tool exits through the canonical error path (no raw `throw` escapes).
- Contract test enumerates each error code.


---

## Why this bean exists (epic context)

Stable error codes let agents self-correct without human intervention.

## Dependencies

**Blocked by:**

- `dinocode-87ah`

**Blocks:**

- _None._

**Related:**

- `dinocode-te2e`

## Testing

### Unit tests

- Every tool asserted to route through canonical codes.

### Integration / end-to-end

- Synthesise each code; assert hint quality.

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
