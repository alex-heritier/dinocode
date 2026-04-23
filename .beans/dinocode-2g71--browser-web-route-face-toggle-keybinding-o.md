---
# dinocode-2g71
title: 'Browser: web route + face toggle keybinding (⌘⇧O)'
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

Wire the browser panel into the existing chat faces model (parallel to `⌘⇧B` for the board).

## Scope

- New command `browser.toggleFace` registered in `@t3tools/contracts`' `STATIC_KEYBINDING_COMMANDS` via the usual dinocode-integration one-liner.
- Default keybinding `⌘⇧O` in `apps/server/src/keybindings.ts`.
- Route: `/_chat/browser/$environmentId/$projectId`.
- Sidebar segmented pill gains a third segment `Chat | Board | Browser` when the project has at least one tab open (otherwise hidden — symmetry with Board pill when no tasks).
- `ChatHeader` gets a "Preview" icon that opens the active project's browser face (actual auto-open of dev server comes in Phase 6).

## Acceptance

- `⌘⇧O` toggles between chat and browser face for the active project.
- Route works when nav'd to directly.
- Tests for `resolveToggleBrowserFaceAction` pure-logic module (mirrors `toggleFace.logic.ts`).
