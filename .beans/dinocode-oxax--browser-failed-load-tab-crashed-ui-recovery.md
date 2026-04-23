---
# dinocode-oxax
title: "Browser: failed-load + tab-crashed UI recovery"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-qb85
---

Gracefully handle network failures, `ERR_CONNECTION_REFUSED` (common for a dev server that hasn't booted), and renderer crashes.

## Scope

- `webContents` events: `did-fail-load`, `render-process-gone`, `unresponsive`.
- UI states:
  - **Failed load**: in-panel card with error code + message + "Retry" + "Copy URL".
  - **Crashed**: "Tab crashed" card with "Reload tab" + "Close tab". Underlying `WebContentsView` rebuilt in-place on reload.
  - **Unresponsive > 10s**: toast "Tab is unresponsive (Wait / Force reload)".
- Agent tools return `TAB_CRASHED` / `LOAD_FAILED` with original error code.

## Acceptance

- Killing a dev server while the tab is open shows the failed-load UI.
- `process.crash()` injected via evaluate → panel shows crashed UI, "Reload tab" recovers.
- No zombie `WebContentsView` left behind after crash (memory verified).

---

## Why this bean exists (epic context)

Dev servers go down, renderers crash. The UI must degrade gracefully and recover without a full app restart.

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-qb85`

**Blocks:**

- `dinocode-yqtt`

**Related:**

- `dinocode-m570`

## Testing

### Unit tests

- State machine (normal → failed → retrying → normal).
- Unresponsive timer fires at 10s.

### Integration / end-to-end

- Kill fixture server; reconnect when it comes back (retry).
- Injected `process.crash()`; `Reload tab` rebuilds view; no memory leak.

### Manual QA

- Stop a real dev server; observe graceful error; restart; reload works.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log every `did-fail-load` and `render-process-gone` with error codes.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] No zombie `WebContentsView` after crash.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
