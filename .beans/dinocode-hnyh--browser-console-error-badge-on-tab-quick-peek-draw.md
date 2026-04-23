---
# dinocode-hnyh
title: "Browser: console error badge on tab + quick-peek drawer"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-yn5x
  - dinocode-bs50
---

Make it visually obvious when a page has errors so users notice without opening DevTools.

## Scope

- Each `TabStrip` chip shows a red dot + count when the ring buffer contains level=`error` entries newer than the last user visit.
- Clicking the dot opens a drawer anchored under the panel listing recent errors with stack traces and "Open in DevTools" links.
- The count resets when the user views the drawer.

## Acceptance

- E2E: load a page with `throw` during boot → red dot appears, drawer lists the error with stack.
- Dot + drawer respect dark/light theme.

---

## Why this bean exists (epic context)

Makes failures visible without DevTools. Tightens the feedback loop from 'what's wrong with the page' to 'now I see it'.

## Dependencies

**Blocked by:**

- `dinocode-yn5x`
- `dinocode-bs50`

**Blocks:**

- _None._

**Related:**

- `dinocode-i71n`

## Testing

### Unit tests

- Count derivation since last visit; drawer state.

### Integration / end-to-end

- Fixture throws on load; badge appears; drawer lists with stack.

### Manual QA

- Real page with errors; badge + drawer feel right.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] Dark + light themes verified.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
