---
# dinocode-ifhu
title: Implement KanbanColumn.tsx component
status: todo
type: task
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T07:33:21Z
parent: dinocode-lsa5
---

Droppable column with `SortableContext`. Renders the filtered card list for its status, handles the "add new card" affordance, and surfaces column metadata (title, count, WIP cap if configured).

## Subtasks

- [ ] `useDroppable` from `@dnd-kit/core` with `id: column.id`, `data: { type: "column", status }`
- [ ] Wrap card list in `SortableContext` with vertical-strategy and `items: column.cards.map(c => c.id)`
- [ ] Column header: status label (title-cased), count badge `{cards.length}`, optional WIP cap warning if exceeded
- [ ] "+" button in header opens the inline task creation form for this column's status
- [ ] Empty state: subtle dashed-border zone with "Drop tasks here" text
- [ ] `aria-label="Column: In Progress (3 cards)"` for screen readers
- [ ] Virtualization hook point: if `column.cards.length > 100`, lazy-render using `react-virtuoso` (stub for now; real impl in Phase 6)
- [ ] Column min-width 280px, max-width 360px, column gap 16px
- [ ] Collapsible (click header arrow) — state persisted in URL search params
- [ ] Unit tests with `@testing-library/react`: drag-over state, empty state, header interactions
