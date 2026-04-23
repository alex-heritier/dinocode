---
# dinocode-ive4
title: "Browser: network ring buffer + Network.* capture"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-u1nj
---

Capture request/response metadata per tab. Body capture is opt-in per-tab (memory + PII).

## Scope

- `NetworkRingBuffer` (default capacity 500 entries per tab).
- Events: `Network.requestWillBeSent`, `Network.responseReceived`, `Network.loadingFinished`, `Network.loadingFailed`.
- Retains `{ id, method, url, status, mimeType, reqHeaders, resHeaders, timing, initiator, failureReason }`.
- Body capture opt-in: `enableBodyCapture(tabId)` → subsequent responses have their body lazily fetchable via `Network.getResponseBody` (capped 1 MiB per response, streamed to disk under `.dinocode/browser/network-bodies/<tabId>/`).

## Acceptance

- Buffer eviction tested.
- Body capture disabled by default; enabling it requires a `unlockNetworkBodies` browser-face action (user gesture).
- Privacy note added to `docs/dinocode-browser.md`.

---

## Why this bean exists (epic context)

The canonical network ring buffer. Body capture is gated behind a privacy choice; always available summary + conditional bodies.

## Dependencies

**Blocked by:**

- `dinocode-u1nj`

**Blocks:**

- `dinocode-w19p`
- `dinocode-rfz5`
- `dinocode-lux5`

**Related:**

- _None._

## Testing

### Unit tests

- Buffer eviction at 500 entries.
- In-flight + completed + failed request state tracking.
- Body capture disabled by default.
- Redaction of auth headers during logging.

### Integration / end-to-end

- Fixture page makes 100 requests; filter by URL regex; body capture opt-in returns expected bytes.

### Manual QA

- Visit a request-heavy site; inspect buffer.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log network summaries at `trace`; never log response bodies by default.

## Risks & mitigations

- **Body capture blows disk** — Cap 1 MiB/response; stream to disk.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
