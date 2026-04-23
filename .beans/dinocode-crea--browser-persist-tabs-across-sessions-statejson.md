---
# dinocode-crea
title: "Browser: persist tabs across sessions (state.json)"
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
  - dinocode-bs50
---

Reopening Dinocode restores the last browser state for each project.

## Scope

- Serialize `{ tabs: [{ url, title, partitionId }], activeTabId }` per project to `.dinocode/browser/state.json` on every `tab:updated`/`tab:closed`.
- On app boot, `BrowserManager.hydrate(projectId)` restores tabs lazily (first tab opened when user enters browser face).
- Corrupt state → log, skip restore, don't crash.

## Acceptance

- Quit and relaunch → same tabs appear.
- Deleting the state file cleanly restarts from blank.
- Unit test for `BrowserStateCodec`.

---

## Why this bean exists (epic context)

Tab persistence makes the browser face feel like a real browser. Must be robust against corruption.

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-bs50`

**Blocks:**

- `dinocode-er1u`
- `dinocode-yqtt`

**Related:**

- _None._

## Testing

### Unit tests

- State-codec round-trip; corrupt-file handling.

### Integration / end-to-end

- Open tabs; quit; relaunch; tabs restore.

### Manual QA

- Kill the app hard; verify graceful recovery.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Corrupt state blocks launch** — Fallback to empty state + toast; never hard-fail.

## Acceptance criteria (superset)

- [ ] State file atomic-written.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
