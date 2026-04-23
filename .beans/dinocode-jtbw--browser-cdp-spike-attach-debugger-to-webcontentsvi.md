---
# dinocode-jtbw
title: "Browser: CDP spike (attach debugger to WebContentsView, evaluate + capture events)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:33Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-r4ns
---

Prove out the core CDP plumbing in a throwaway spike before building the real `BrowserManager`.

## Goal

Inside a short-lived Electron test script (or `apps/desktop` smoke test), spin up a `WebContentsView`, attach `webContents.debugger`, enable `Runtime` + `Page` + `Network` domains, navigate to a localhost URL, and:

- Evaluate `1 + 1` via `Runtime.evaluate`, assert the result.
- Capture a `Runtime.consoleAPICalled` event from `console.log` inside the page.
- Capture a `Network.requestWillBeSent` for the initial document load.
- Capture a `Runtime.exceptionThrown` from `throw new Error('x')` inside the page.
- Verify user `webContents.openDevTools()` still works with our debugger attached (multi-client).

## Acceptance

- Spike lives in `packages/dinocode-browser/src/tests/cdpSpike.test.ts` behind an env flag (requires Electron runtime).
- Results documented in `docs/dinocode-browser.md` "Verified assumptions" section.
- Spike deleted or converted into a real integration test once Phase 2 lands.

---

## Why this bean exists (epic context)

We need hard evidence that every CDP domain we plan on (Runtime, Page, Network, DOM, Accessibility) behaves the way we think on Electron 40. One day of spiking saves weeks of mid-phase rework.

## Dependencies

**Blocked by:**

- `dinocode-r4ns`

**Blocks:**

- `dinocode-ousa`
- `dinocode-u1nj`

**Related:**

- `dinocode-27vx`

## Testing

### Unit tests

- Spike itself is the test.

### Integration / end-to-end

- `evaluate('1+1')` round-trip.
- `Runtime.consoleAPICalled` captured.
- `Network.requestWillBeSent` captured.
- `Runtime.exceptionThrown` captured on `throw`.
- User `openDevTools()` co-exists with our CDP client (M89+ multi-client).

### Manual QA

- Run the spike on macOS + Linux + Windows once.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Spike results written into `docs/dinocode-browser.md` 'Verified assumptions'.

## Risks & mitigations

- **Electron 40 quirks we don't discover until later phases** — Spike intentionally covers every CDP domain we plan to use so surprises land here.

## Acceptance criteria (superset)

- [ ] All 5 spike assertions pass on at least 2 OSes.
- [ ] Results recorded in the architecture doc.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
