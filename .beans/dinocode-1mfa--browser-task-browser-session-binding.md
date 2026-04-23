---
# dinocode-1mfa
title: 'Browser: task ↔ browser session binding'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-6-project
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-rfz5
    - dinocode-87ah
---

Tie recorded browser sessions to tasks so agents and users can retrieve "the browser session where I reproduced this bug".

## Scope

- When recording is active and a task is in focus (from `TaskDetailSheet` or the active thread's bound task — dinocode-h41x), write `taskId` into the session manifest.
- New tool: `dinocode_browser_list_sessions_for_task({ taskId })`.
- Task detail sheet gets a "Browser sessions (N)" section listing recordings bound to it, with thumbnails.

## Acceptance

- Recorded sessions discoverable from the task's detail sheet.
- Agent tool returns session list + summary metadata.


---

## Why this bean exists (epic context)

Durable link from a recorded session to the task it was debugging.

## Dependencies

**Blocked by:**

- `dinocode-rfz5`
- `dinocode-87ah`

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Manifest taskId assignment rules.

### Integration / end-to-end

- Record with a task focused; task detail sheet shows the session.

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
