---
# dinocode-w19p
title: 'Browser tool: dinocode_browser_get_network (requests + optional body)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Expose the network ring buffer to the agent.

## Scope

- `dinocode_browser_get_network({ tabId, since?: cursor, limit?: number, includeBody?: boolean, urlFilter?: regex })` → `{ entries, nextCursor }`.
- Entries contain `{ id, method, url, status, mimeType, timing, initiator, failureReason?, reqHeaders, resHeaders }`.
- If `includeBody`, body capture must have been enabled on the tab; bodies > 1 MiB return a path instead of inline content.
- `dinocode_browser_get_network_body({ tabId, requestId })` retrieves a single body.

## Acceptance

- Regex URL filter works.
- Requests-without-response (in-flight) show `status: null`.
