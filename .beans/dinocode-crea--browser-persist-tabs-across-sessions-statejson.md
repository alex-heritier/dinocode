---
# dinocode-crea
title: 'Browser: persist tabs across sessions (state.json)'
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

Reopening Dinocode restores the last browser state for each project.

## Scope

- Serialize `{ tabs: [{ url, title, partitionId }], activeTabId }` per project to `.dinocode/browser/state.json` on every `tab:updated`/`tab:closed`.
- On app boot, `BrowserManager.hydrate(projectId)` restores tabs lazily (first tab opened when user enters browser face).
- Corrupt state → log, skip restore, don't crash.

## Acceptance

- Quit and relaunch → same tabs appear.
- Deleting the state file cleanly restarts from blank.
- Unit test for `BrowserStateCodec`.
