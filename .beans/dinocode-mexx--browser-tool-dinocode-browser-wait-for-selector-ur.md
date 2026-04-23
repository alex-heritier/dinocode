---
# dinocode-mexx
title: 'Browser tool: dinocode_browser_wait_for (selector / url / console / network-idle)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Robust waiters so agents don't hardcode `sleep` and don't hang.

## Scope

- `dinocode_browser_wait_for({ tabId, condition, timeoutMs? })` where `condition` is one of:
  - `{ type: 'selector', selector, state: 'visible'|'attached'|'detached'|'hidden' }`
  - `{ type: 'url', pattern: regex }`
  - `{ type: 'console', pattern: regex, level? }`
  - `{ type: 'network', urlPattern: regex, status? }`
  - `{ type: 'networkIdle', idleMs: number, maxInflight: number }`
- Default 10s timeout, max 60s.

## Acceptance

- Each condition tested.
- Timeout returns `{ ok: false, code: 'TIMEOUT', hint: '<what we last observed>' }`.
