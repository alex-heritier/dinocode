---
# dinocode-hnyh
title: 'Browser: console error badge on tab + quick-peek drawer'
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

Make it visually obvious when a page has errors so users notice without opening DevTools.

## Scope

- Each `TabStrip` chip shows a red dot + count when the ring buffer contains level=`error` entries newer than the last user visit.
- Clicking the dot opens a drawer anchored under the panel listing recent errors with stack traces and "Open in DevTools" links.
- The count resets when the user views the drawer.

## Acceptance

- E2E: load a page with `throw` during boot → red dot appears, drawer lists the error with stack.
- Dot + drawer respect dark/light theme.
