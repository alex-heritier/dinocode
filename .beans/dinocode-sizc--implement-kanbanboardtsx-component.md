---
# dinocode-sizc
title: Implement KanbanBoard.tsx component
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T12:49:22Z
parent: dinocode-lsa5
blocked_by:
    - dinocode-0qbh
    - dinocode-ifhu
    - dinocode-8u6r
---

Top-level board container. Owns DndContext. Renders columns. Handles drag-end: dispatches task.update with new status or fractional order. Board header with New Task button and filter bar.

## Subtasks

- [ ] Set up `DndContext` with `PointerSensor` + `KeyboardSensor`
- [ ] Implement `onDragEnd`: detect cross-column move (status change) vs same-column reorder
- [ ] For status change: dispatch `task.update` with new status, compute new `order` via fractional indexing
- [ ] For reorder: compute new `order` fractional index between adjacent cards, dispatch `task.update`
- [ ] Implement fractional index helper: `generateOrderBetween(before, after): string` (LexoRank-style)
- [ ] Board header: project name (from config), `[New Task +]` button, `[Filter ▾]` dropdown
- [ ] Filter dropdown: filter by status, type, priority, tag; filter state lives in URL search params
- [ ] Optimistic update on drag: update local store immediately, revert on RPC error
- [ ] Keep files <500 LOC; split into `BoardHeader.tsx`, `useDragHandlers.ts`, `fractionalIndex.ts`
