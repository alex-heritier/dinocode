---
# dinocode-0qbh
title: Implement KanbanCard.tsx component
status: todo
type: task
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T07:14:14Z
parent: dinocode-lsa5
---

Draggable card. Shows title, priority badge, type icon, tag chips, blocked indicator. Click → set selectedTaskId. Cmd+click → enter dependency-link mode.

## Subtasks

- [ ] Priority badge: color-coded pill (critical=red, high=orange, normal=gray, low=blue, deferred=dim)
- [ ] Type icon: small icon per type (milestone=flag, epic=layers, bug=bug, feature=star, task=checkbox)
- [ ] Tag chips: truncate after 2 tags, +N overflow indicator
- [ ] Blocked indicator: lock icon if `blocked_by` has non-completed tasks
- [ ] Drag handle: grab cursor on left edge, only drag from handle to avoid accidental drags
- [ ] Cmd+click detection: `event.metaKey || event.ctrlKey` → call `onDependencyLinkStart(taskId)`
- [ ] `aria-label` and keyboard navigation (Enter/Space to open detail)
