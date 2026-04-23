---
# dinocode-tb6r
title: 'Browser: DevTools toggle (user Inspect Element)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Expose Electron DevTools for the active tab so users can inspect/debug manually.

## Scope

- Toolbar button + keyboard shortcut `⌘⌥I` open `webContents.openDevTools({ mode: 'detach' })` for the active tab.
- Right-click menu inside the embedded page includes "Inspect Element" (standard Electron context menu).
- Closing DevTools must not sever our CDP attachment (verified in Phase 0 spike; re-verify here with a regression test).

## Acceptance

- User can press `⌘⌥I` → detached DevTools window opens targeting the active tab.
- Console, Network, Elements, Sources panels all work as in Chrome.
- Closing the DevTools window leaves our agent-side CDP subscriptions intact (asserted via `Runtime.consoleAPICalled` still firing afterwards).
