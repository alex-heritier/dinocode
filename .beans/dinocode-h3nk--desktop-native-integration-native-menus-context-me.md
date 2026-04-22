---
# dinocode-h3nk
title: "Desktop native integration: native menus, context menus, auto-update for Dinocode"
status: todo
type: feature
priority: normal
tags:
  - desktop
created_at: 2026-04-22T07:41:46Z
updated_at: 2026-04-22T07:41:46Z
parent: dinocode-xd5m
---

Dinocode-specific desktop affordances beyond what t3code already provides.

## Subtasks

### Menus

- [ ] File menu: "Open Project…", "New Task" (`Cmd+N` scoped to board focus), "Initialize Dinocode" (when missing)
- [ ] View menu: "Board" (`Cmd+1`), "Threads" (`Cmd+2`), "Archive" (`Cmd+Shift+A`)
- [ ] Agents menu: open home agent, list active sessions

### Context menus

- [ ] Right-click card: Open, Copy ID, Copy Markdown link, Open in Editor (the task file), Start Session, Archive, Delete
- [ ] Right-click column header: Collapse/Expand, Set WIP cap

### Deep links

- [ ] `dinocode://task/<id>` opens the app (or focuses it) and navigates to that task
- [ ] `dinocode://board/<projectId>?filter=…` deep-links into a filtered board
- [ ] Register custom protocol in Electron main

### Auto-update

- [ ] Update feed URL points to dinocode release channel
- [ ] Release notes include task-level changelog when possible
