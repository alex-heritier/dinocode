---
# dinocode-yne5
title: 'Browser tool: dinocode_browser_evaluate (JS eval + JSON result)'
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

The workhorse tool for debugging: run arbitrary JS in the active page's main world.

## Scope

- `dinocode_browser_evaluate({ tabId, expression, awaitPromise?: boolean, timeoutMs?: number, worldName?: 'main'|'isolated' })` → `{ value (JSON-safe), undefinedResult, error? }`.
- Uses `Runtime.evaluate` with `returnByValue: true`.
- Default 5s timeout, max 30s.
- Non-JSON-safe values returned as `{ __repr: '<Symbol>'  }` or similar sentinel.
- `awaitPromise` supports async functions.

## Acceptance

- Can evaluate DOM queries, localStorage reads, network-level fetches (`fetch().then(r => r.json())`).
- Syntax errors + runtime errors surface under `error: { name, message, stack }`.
- Hardened against mutating global scope accidentally (tool docs warn).
