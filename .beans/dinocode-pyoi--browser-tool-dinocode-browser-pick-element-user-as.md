---
# dinocode-pyoi
title: 'Browser tool: dinocode_browser_pick_element (user-assisted crosshair)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Give the user a one-click way to hand the agent a selector for the element they care about.

## Scope

- When `dinocode_browser_pick_element({ tabId, prompt?: string })` is invoked, the browser panel shows a crosshair overlay ("Click an element to point the agent at it"). User clicks → overlay captures target → returns a stable selector chain (id → data-testid → class+nth-child → generated robust selector).
- Overlay is rendered in main via `Overlay.highlightNode` or an injected content script (whichever yields cleaner selection).
- Cancelling (Esc) returns `USER_CANCELLED`.

## Acceptance

- Selector returned works in `dinocode_browser_query_selector` without modification.
- E2E: user picks a button on localhost:3000 → agent clicks it via the returned selector.
