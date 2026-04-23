---
# dinocode-8xd5
title: 'Browser: ''Preview'' button in ChatHeader + board that opens the dev server'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-6-project
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

The highest-frequency entry point.

## Scope

- `ChatHeader` gets a "Preview" icon button next to the existing board icon (gated on the project having a detected dev-server URL).
- Clicking navigates to the browser face and opens or focuses the tab pointing at the detected URL.
- Board screen gets the same button in its header.
- Tooltip shows the detected URL + confidence ("Vite — http://localhost:5173").

## Acceptance

- Works end-to-end with a freshly scaffolded Vite project.
- No button shown when no dev server is detected.
