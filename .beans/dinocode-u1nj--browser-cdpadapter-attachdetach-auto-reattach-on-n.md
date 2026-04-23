---
# dinocode-u1nj
title: "Browser: CdpAdapter (attach/detach + auto-reattach on nav)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-2-cdp
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-jtbw
---

A thin, testable wrapper around `webContents.debugger` that the rest of the browser subsystem depends on.

## Scope

- Attach on tab create; detach on tab close.
- On navigation / cross-process frame swap, re-enable the Runtime/Page/Network/Accessibility domains and re-install listeners (Chromium resets the session on cross-origin navigations).
- Exposes typed `send(method, params)` and a typed event subscription surface.
- Error-coerces CDP faults into the browser subsystem's tagged errors.

## Acceptance

- Unit tests with a mock debugger simulate attach/detach + cross-origin nav; listeners survive both.
- No leaked event listeners after `dispose()`.

---

## Why this bean exists (epic context)

The thin typed wrapper around `webContents.debugger` that everything CDP-driven depends on. Getting attach + auto-reattach right here prevents dozens of subtle bugs downstream.

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-jtbw`

**Blocks:**

- `dinocode-yn5x`
- `dinocode-ive4`
- `dinocode-i71n`
- `dinocode-yne5`
- `dinocode-56ga`
- `dinocode-07j6`
- `dinocode-cbcb`
- `dinocode-mexx`
- `dinocode-7bew`
- `dinocode-aikp`
- `dinocode-ayoh`
- `dinocode-27vx`
- `dinocode-j4ve`
- `dinocode-fgw7`

**Related:**

- _None._

## Testing

### Unit tests

- Attach/detach idempotency; listener cleanup.
- Cross-origin navigation triggers re-enable of every domain.
- CDP error coercion into tagged errors.

### Integration / end-to-end

- Harness: navigate across origins; assert subscriptions survive.

### Manual QA

- Real cross-origin nav on a test page.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log every attach/detach/re-enable with reasons.

## Risks & mitigations

- **Silent listener loss on OOPIF** — Explicit re-subscribe on `Target.attachedToTarget` for child frames.

## Acceptance criteria (superset)

- [ ] No leaked listeners after `dispose()`.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
