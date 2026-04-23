---
# dinocode-49oz
title: 'Browser: address bar (URL, go, reload, back, forward, stop)'
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

Build the Chrome-style URL bar on top of the existing `BrowserManager` + `BrowserPanel`.

## Scope

- `AddressBar.tsx` with: URL input (auto-complete against per-project history), Go button, reload, back, forward, stop (during load).
- `⌘L` focuses the URL bar when browser panel is focused.
- `⌘R` reloads the active tab.
- Typing `about:blank` / `chrome://…` is rejected with a toast.
- Shows load progress as a thin top bar.

## Acceptance

- Navigation works for localhost URLs out of the box (after Phase 0 allowlist).
- History persists per project under `.dinocode/browser/history.json`.
- Pure-logic module for URL normalization + history ranking is unit tested.
