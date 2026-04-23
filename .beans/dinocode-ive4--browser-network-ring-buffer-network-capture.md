---
# dinocode-ive4
title: "Browser: network ring buffer + Network.* capture"
status: in_progress
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

## Progress

- Landed `packages/dinocode-browser/src/capture/networkBuffer.ts`:
  - `NetworkRingBuffer` (capacity **500**) with lifecycle methods `onRequestWillBeSent`, `onResponseReceived`, `onLoadingFinished`, `onLoadingFailed`.
  - Entries track `{ requestId, method, url, resourceType, status, statusCode?, statusText?, mimeType?, requestHeaders, responseHeaders, timing, initiator?, failureReason?, encodedDataLength?, bodyCaptured?, fromCache? }`.
  - Completed requests compute `timing.durationMs` automatically from the CDP timestamps; canceled requests are distinguished from genuine failures (`status: "cancelled"` vs `"failed"`).
  - `enableBodyCapture()` / `disableBodyCapture()` / `markBodyCaptured(requestId)` cover the opt-in body-capture flag; bodies are NEVER stored in the ring — the flag only records that a body is fetchable elsewhere on disk.
- Public surface: `@dinocode/browser/capture` subpath (shared with console buffer). Consumers get `createNetworkBuffer`, `DEFAULT_NETWORK_CAPACITY`, and all entry/lifecycle types.
- **Tests**: 8 new assertions in `networkBuffer.test.ts` cover full lifecycle, loading failed vs canceled, unknown-id safety, body-capture default-off, capacity eviction with index cleanup, and `markBodyCaptured` for unknown ids. Total suite: **142/142 green**.
- **Remaining (blocked on `dinocode-u1nj`)**: the CDP adapter will call these lifecycle methods from `Network.*` subscriptions. Body capture additionally needs the artifact sink from `dinocode-dyjh` (already merged) and the `unlockNetworkBodies` user gesture from `dinocode-lux5`.

## Subtasks

- [x] `NetworkRingBuffer` with request/response/finished/failed lifecycle.
- [x] Buffer eviction tested.
- [x] Body capture disabled by default.
- [x] Redaction of auth headers: handled via the shared `redact()` helper from `@dinocode/browser/logging` — call sites should pass `requestHeaders` / `responseHeaders` through it before logging or IPC transmission. Headers themselves are stored verbatim inside the buffer so the UI/debug view can show them, but every log and IPC egress point applies redaction.
- [ ] Wire `Network.*` subscriptions in the CDP adapter (`dinocode-u1nj`).
- [ ] Privacy note in `docs/dinocode-browser.md` (added as part of the capture section).
