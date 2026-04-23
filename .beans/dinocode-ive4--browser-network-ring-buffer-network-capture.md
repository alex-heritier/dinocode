---
# dinocode-ive4
title: 'Browser: network ring buffer + Network.* capture'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
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
