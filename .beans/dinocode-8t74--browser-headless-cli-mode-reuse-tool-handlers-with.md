---
# dinocode-8t74
title: 'Browser: headless CLI mode (reuse tool handlers without the GUI)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-7-later
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-w0qv
    - dinocode-t2l9
    - dinocode-yne5
    - dinocode-07j6
    - dinocode-c3lk
    - dinocode-w19p
    - dinocode-kww9
    - dinocode-34kt
    - dinocode-mexx
---

Expose the same browser tools to the `dinocode` CLI for scripted/CI use.

## Scope

- `dinocode browser open <url>`, `dinocode browser eval <expr>`, `dinocode browser screenshot <url> -o <path>`, etc.
- Under the hood, spawn a headless Electron process (or Chromium via Playwright as a fallback) that mounts `BrowserManager` without a UI.
- Reuses the existing tool handlers unchanged — separation between handler and transport.

## Acceptance

- `dinocode browser eval "1+1"` prints `2` in a CI container (headless).
- Same allowlist + error taxonomy as GUI mode.


---

## Why this bean exists (epic context)

Same tool surface in CI / scripts, not just the GUI.

## Dependencies

**Blocked by:**

- `dinocode-w0qv`
- `dinocode-t2l9`
- `dinocode-yne5`
- `dinocode-07j6`
- `dinocode-c3lk`
- `dinocode-w19p`
- `dinocode-kww9`
- `dinocode-34kt`
- `dinocode-mexx`

**Blocks:**

- _None._

**Related:**

- `dinocode-yaan`

## Testing

### Unit tests

- CLI arg parsing; output shape parity.

### Integration / end-to-end

- `dinocode browser eval '1+1'` in a headless container returns `2`.

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
