---
# dinocode-cbcb
title: 'Browser tool: dinocode_browser_query_selector (resolve + describe)'
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

Find an element and describe it structurally; returns a stable ref usable by click/type/fill.

## Scope

- `dinocode_browser_query_selector({ tabId, selector (CSS or XPath), waitForMs?: number })` → `{ ref, role, text, box, visible, disabled }`.
- Under the hood, `Runtime.evaluate` + `DOM.resolveNode` → store a node-id-keyed handle.
- If not found after `waitForMs`, returns `NOT_FOUND` with the last polled count.

## Acceptance

- Works for common forms of selector (`#id`, `.class`, `button[aria-label="…"]`, XPath `//button[.="OK"]`).
- Returned `box` in viewport pixels.
