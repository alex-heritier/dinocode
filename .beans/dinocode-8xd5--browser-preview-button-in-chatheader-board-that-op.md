---
# dinocode-8xd5
title: 'Browser: ''Preview'' button in ChatHeader + board that opens the dev server'
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
    - dinocode-756x
    - dinocode-w0qv
    - dinocode-2g71
---

The highest-frequency entry point.

## Scope

- `ChatHeader` gets a "Preview" icon button next to the existing board icon (gated on the project having a detected dev-server URL).
- Clicking navigates to the browser face and opens or focuses the tab pointing at the detected URL.
- Board screen gets the same button in its header.
- Tooltip shows the detected URL + confidence ("Vite — http://localhost:5173").

## Acceptance

- Works end-to-end with a freshly scaffolded Vite project.
- No button shown when no dev server is detected.


---

## Why this bean exists (epic context)

The highest-frequency entry point to the browser.

## Dependencies

**Blocked by:**

- `dinocode-756x`
- `dinocode-w0qv`
- `dinocode-2g71`

**Blocks:**

- `dinocode-jzfg`

**Related:**

- _None._

## Testing

### Unit tests

- Button-visibility rules; label + tooltip copy.

### Integration / end-to-end

- Click opens or focuses the tab for the project's detected URL.

### Manual QA

- Real project; click; verify.

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
