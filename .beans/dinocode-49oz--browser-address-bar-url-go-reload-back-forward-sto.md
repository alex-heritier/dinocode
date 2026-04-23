---
# dinocode-49oz
title: "Browser: address bar (URL, go, reload, back, forward, stop)"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:33Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-qb85
  - dinocode-ousa
---

Build the Chrome-style URL bar on top of the existing `BrowserManager` + `BrowserPanel`.

## Scope

- `AddressBar.tsx` with: URL input (auto-complete against per-project history), Go button, reload, back, forward, stop (during load).
- `⌘L` focuses the URL bar when browser panel is focused.
- `⌘R` reloads the active tab.
- Typing `about:blank` / `chrome://…` is rejected with a toast.
- Shows load progress as a thin top bar.

## Acceptance

- Navigation works for localhost URLs out of the box (after Phase 0 allowlist).
- History persists per project under `.dinocode/browser/history.json`.
- Pure-logic module for URL normalization + history ranking is unit tested.

---

## Why this bean exists (epic context)

The primary user entry point for navigation. Must be snappy, keyboard-first, and exhibit Chrome-like affordances so users can skip the learning curve.

## Dependencies

**Blocked by:**

- `dinocode-qb85`
- `dinocode-ousa`

**Blocks:**

- `dinocode-er1u`

**Related:**

- `dinocode-7bew`

## Testing

### Unit tests

- URL normalisation (scheme inference, whitespace, about: blocking).
- History ranking pure-function behaviour.
- Load-progress state transitions.

### Integration / end-to-end

- Type URL + Enter navigates the active tab.
- Reload / back / forward / stop each behave as expected.

### Manual QA

- Feels responsive under 50 ms per keystroke.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] History persisted per project.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
