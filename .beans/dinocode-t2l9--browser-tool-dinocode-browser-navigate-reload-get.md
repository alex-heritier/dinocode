---
# dinocode-t2l9
title: 'Browser tool: dinocode_browser_navigate / reload / get_url'
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

Cross-tab navigation primitives for the agent.

## Scope

- `dinocode_browser_navigate({ tabId, url })` — allowlist applied; waits for `Page.frameStoppedLoading` before returning `{ url, title, statusCode }`.
- `dinocode_browser_reload({ tabId, bypassCache?: boolean })`.
- `dinocode_browser_get_url({ tabId })` → `{ url, title, loadState: 'loading'|'complete'|'failed' }`.

## Acceptance

- `navigate` returns after load with HTTP status surfaced.
- `reload` bypass-cache verified via a `Cache-Control: max-age` fixture.
