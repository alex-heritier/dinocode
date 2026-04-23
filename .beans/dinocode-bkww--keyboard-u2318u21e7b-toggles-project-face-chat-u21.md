---
# dinocode-bkww
title: 'Keyboard: \u2318\u21e7B toggles project face (chat \u2194 board)'
status: todo
type: task
priority: high
created_at: 2026-04-23T04:38:29Z
updated_at: 2026-04-23T04:38:29Z
parent: dinocode-qsqf
---

Add `project.toggleFace` keybinding: from a thread, jumps to that project's board; from a board, jumps to the last-visited thread of that project.

## Implementation

- Add `"project.toggleFace"` to `STATIC_KEYBINDING_COMMANDS` in `packages/contracts/src/keybindings.ts` (upstream candidate, but acceptable here per `docs/dinocode-packages.md` integration rules — annotate with `// dinocode-integration:` comment).
- Default binding: `Cmd+Shift+B` (mac), `Ctrl+Shift+B` (other).
- Handler resolution:
  1. If on `/_chat/$env/$thread` → resolve project from thread metadata, navigate to `/board/$env/$project`.
  2. If on `/_chat/board/$env/$project` → resolve last-visited thread for that project via `uiStateStore.threadLastVisitedAtById`; if none, create a new thread.
  3. Otherwise → open command palette's "Faces" group (added in dinocode-7w2e).
- Register in `ChatRouteGlobalShortcuts` in `apps/web/src/routes/_chat.tsx`.

## Acceptance

- Shortcut registered; visible in command palette with label.
- Pressing `\u2318\u21e7B` from a thread opens the project's board.
- Pressing `\u2318\u21e7B` from a board opens the last-visited thread, or creates a new one if none exist.
- Pressing from an indeterminate context is a no-op (or opens palette).
- Unit tests for the face-resolution logic (pure function given current route + last-visit map).
