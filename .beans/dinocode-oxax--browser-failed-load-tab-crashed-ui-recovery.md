---
# dinocode-oxax
title: 'Browser: failed-load + tab-crashed UI recovery'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Gracefully handle network failures, `ERR_CONNECTION_REFUSED` (common for a dev server that hasn't booted), and renderer crashes.

## Scope

- `webContents` events: `did-fail-load`, `render-process-gone`, `unresponsive`.
- UI states:
  - **Failed load**: in-panel card with error code + message + "Retry" + "Copy URL".
  - **Crashed**: "Tab crashed" card with "Reload tab" + "Close tab". Underlying `WebContentsView` rebuilt in-place on reload.
  - **Unresponsive > 10s**: toast "Tab is unresponsive (Wait / Force reload)".
- Agent tools return `TAB_CRASHED` / `LOAD_FAILED` with original error code.

## Acceptance

- Killing a dev server while the tab is open shows the failed-load UI.
- `process.crash()` injected via evaluate → panel shows crashed UI, "Reload tab" recovers.
- No zombie `WebContentsView` left behind after crash (memory verified).
