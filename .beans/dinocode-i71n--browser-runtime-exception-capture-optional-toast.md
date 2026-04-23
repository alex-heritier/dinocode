---
# dinocode-i71n
title: 'Browser: runtime exception capture + optional toast'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Surface uncaught exceptions proactively.

## Scope

- Subscribe to `Runtime.exceptionThrown`.
- Default: add to console ring buffer with level `error` (already handled by previous bean for console.error — uncaught exceptions go through this path instead).
- User setting: "Toast on uncaught exception" (default off — too noisy during iterative dev).
- Agent tool `dinocode_browser_get_console` returns exceptions and console logs in the same unified stream.

## Acceptance

- Injected uncaught error appears in ring buffer within one event loop tick.
- Toggle behavior verified in a smoke test.
