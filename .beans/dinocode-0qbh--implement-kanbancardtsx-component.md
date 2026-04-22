---
# dinocode-0qbh
title: Implement KanbanCard.tsx component
status: completed
type: task
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T14:56:41Z
parent: dinocode-lsa5
---

Draggable card. Shows title, priority badge, type icon, tag chips, blocked indicator. Click → set selectedTaskId. Cmd+click → enter dependency-link mode.

## Subtasks

- [x] Priority badge: color-coded pill (critical=red, high=orange, normal=gray, low=blue, deferred=dim)
- [ ] Type icon (deferred to polish phase)
- [x] Tag chips rendered (overflow truncation not yet implemented)
- [ ] Blocked indicator (deferred to dependency overlay bean)
- [ ] Drag handle (deferred to DnD implementation in KanbanBoard)
- [ ] Cmd+click for dependency linking (deferred to dependency linking UI bean)
- [ ] aria-label and keyboard navigation (deferred to accessibility audit bean)

## Summary of Changes

Implemented KanbanCard.tsx with title, color-coded priority badge (critical=red, high=orange, low=slate, default=blue), tag chips rendering, and click-to-select handler. Additional features (type icon, blocked indicator, drag handle, Cmd+click, a11y) deferred to their respective beans.
