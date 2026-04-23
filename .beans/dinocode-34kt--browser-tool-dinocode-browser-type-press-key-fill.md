---
# dinocode-34kt
title: 'Browser tool: dinocode_browser_type / press_key / fill_form'
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

Simulated keyboard input + high-level form fill.

## Scope

- `dinocode_browser_type({ tabId, ref | selector, text, replace?: boolean })` — typing sends real key events (`Input.dispatchKeyEvent`) so IMEs and oninput handlers behave correctly.
- `dinocode_browser_press_key({ tabId, key, modifiers? })` — single key (`Enter`, `Escape`, `ArrowDown`, `Meta+A`).
- `dinocode_browser_fill_form({ tabId, fields: [{ labelOrRef, value }] })` — high-level fill: resolves labels → inputs, types each.

## Acceptance

- Typing into a `<textarea>` with `onInput` handler triggers the handler for each keystroke.
- `press_key` supports common editor shortcuts.
- `fill_form` resolves by `<label for>`, `aria-labelledby`, or placeholder fallback.
