---
# dinocode-nfw2
title: Kanban keyboard shortcuts and command palette integration
status: todo
type: feature
priority: normal
tags:
  - phase-2
  - a11y
created_at: 2026-04-22T07:34:22Z
updated_at: 2026-04-22T07:34:22Z
parent: dinocode-lsa5
---

First-class keyboard support for the board, integrated with the existing keybindings system (`apps/server/src/keybindings.ts` and the `CommandPalette`).

## Subtasks

### Shortcuts (default)

- [ ] `N` → focus inline task creation in the Todo column
- [ ] `/` → focus search in filter bar
- [ ] `Esc` → close detail panel or clear search
- [ ] `J`/`K` → move card selection down/up within a column
- [ ] `H`/`L` → move card selection across columns (wraps)
- [ ] `Enter` → open detail panel for selected card
- [ ] `Shift+J`/`Shift+K` → move selected card down/up within column (update `order`)
- [ ] `Shift+H`/`Shift+L` → move selected card across columns (update `status`)
- [ ] `D` → delete selected card (with confirm)
- [ ] `A` → archive selected card
- [ ] `Cmd/Ctrl+Enter` on inline form → submit and keep form open

### Integration

- [ ] Register every binding in the existing keybindings registry (user-overridable)
- [ ] Add entries to `KEYBINDINGS.md`
- [ ] Expose board-scoped commands in the command palette ("Create task", "Go to Board", "Show/Hide dependencies")

### Selection model

- [ ] Add `selectedCardId` to board slice in store
- [ ] Render focus ring on selected card
- [ ] Clicking anywhere else clears selection

### Tests

- [ ] Keybinding.test.ts covers each default binding
- [ ] User override of `N` → propagates to board without code changes
