---
# dinocode-kww9
title: 'Browser tool: dinocode_browser_click / hover'
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

Simulated mouse input for the agent.

## Scope

- `dinocode_browser_click({ tabId, ref | selector | xy, button?, modifiers?, clickCount? })` → `{ ok, navigationOccurred }`.
- Uses `Input.dispatchMouseEvent` for precise control (not `element.click()`).
- Auto-scrolls the element into view before clicking.
- `dinocode_browser_hover({ tabId, ref | selector | xy })` → `{ ok }`.
- Rejects clicks on offscreen / disabled / detached elements with `NOT_INTERACTABLE`.

## Acceptance

- Clicks work for buttons, links, labels, checkboxes, native date pickers (for the visible cases).
- Navigation-causing clicks waited on via `Page.frameStoppedLoading`.
