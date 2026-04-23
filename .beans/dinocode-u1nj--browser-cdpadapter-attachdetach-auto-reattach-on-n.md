---
# dinocode-u1nj
title: 'Browser: CdpAdapter (attach/detach + auto-reattach on nav)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-2-cdp
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

A thin, testable wrapper around `webContents.debugger` that the rest of the browser subsystem depends on.

## Scope

- Attach on tab create; detach on tab close.
- On navigation / cross-process frame swap, re-enable the Runtime/Page/Network/Accessibility domains and re-install listeners (Chromium resets the session on cross-origin navigations).
- Exposes typed `send(method, params)` and a typed event subscription surface.
- Error-coerces CDP faults into the browser subsystem's tagged errors.

## Acceptance

- Unit tests with a mock debugger simulate attach/detach + cross-origin nav; listeners survive both.
- No leaked event listeners after `dispose()`.
