---
# dinocode-jzfg
title: 'Browser: auto-open preview on Start Session for ui/frontend tasks'
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
    - dinocode-8xd5
---

Close the loop from kanban → agent thread → live preview.

## Scope

- When the Start Session action fires from `TaskDetailSheet` (dinocode-xjal) for a task tagged `ui`, `frontend`, or `web`, also open the browser face with the detected dev-server URL.
- User setting: "Auto-open preview for UI tasks" (default on).
- No-op when dev server is undetected or user disabled the setting.

## Acceptance

- Pressing Start Session on a `ui`-tagged task opens both the chat thread AND the browser face with the preview URL.
- Unit test for the decision function.


---

## Why this bean exists (epic context)

Closes the loop kanban → agent thread → preview.

## Dependencies

**Blocked by:**

- `dinocode-8xd5`

**Blocks:**

- _None._

**Related:**

- `dinocode-lux5`

## Testing

### Unit tests

- Decision function: task tags, setting state, detection confidence.

### Integration / end-to-end

- Start Session on `ui`-tagged task; browser face opens to preview URL.

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
