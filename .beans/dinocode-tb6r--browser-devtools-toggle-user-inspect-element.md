---
# dinocode-tb6r
title: 'Browser: DevTools toggle (user Inspect Element)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:33Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-qb85
---

Expose Electron DevTools for the active tab so users can inspect/debug manually.

## Scope

- Toolbar button + keyboard shortcut `⌘⌥I` open `webContents.openDevTools({ mode: 'detach' })` for the active tab.
- Right-click menu inside the embedded page includes "Inspect Element" (standard Electron context menu).
- Closing DevTools must not sever our CDP attachment (verified in Phase 0 spike; re-verify here with a regression test).

## Acceptance

- User can press `⌘⌥I` → detached DevTools window opens targeting the active tab.
- Console, Network, Elements, Sources panels all work as in Chrome.
- Closing the DevTools window leaves our agent-side CDP subscriptions intact (asserted via `Runtime.consoleAPICalled` still firing afterwards).


---

## Why this bean exists (epic context)

Inspect Element is the user-facing killer feature. Must work with our own CDP client attached simultaneously.

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-qb85`

**Blocks:**

- `dinocode-ayoh`

**Related:**

- _None._

## Testing

### Unit tests

- Toolbar button wiring.

### Integration / end-to-end

- Open DevTools; our `evaluate` still returns results.
- Close DevTools; `Runtime.consoleAPICalled` events still reach the ring buffer.

### Manual QA

- Inspect a real page; set a breakpoint; step through; our ring buffer keeps capturing.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log DevTools open/close events.

## Risks & mitigations

- **CDP silently drops our subscriptions when DevTools attaches** — Covered by `cdp-multi-client` bean with auto-resubscribe logic.

## Acceptance criteria (superset)

- [ ] `⌘⌥I` works; right-click → Inspect Element works.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
