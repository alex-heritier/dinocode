---
# dinocode-388g
title: Fractional index utility (shared, LexoRank-style)
status: todo
type: feature
priority: high
tags:
    - phase-1
    - utilities
created_at: 2026-04-22T07:32:55Z
updated_at: 2026-04-22T07:32:55Z
parent: dinocode-x8dw
---

Used by the kanban board to order cards within a column without renumbering siblings on every move. Shared utility consumed by both server-side default assignment (on `task.create`) and client-side drag-end computation.

## Subtasks

### Module
- [ ] Create `packages/shared/src/fractionalIndex/` with explicit subpath export `"./fractionalIndex"`
- [ ] API: `generateOrderBetween(before: string | null, after: string | null): string`, `compareOrder(a, b): -1 | 0 | 1`, `generateInitialOrder(): string`, `rebalanceColumn(orders: string[]): string[]`
- [ ] Base-36 alphabet variant of LexoRank (ASCII-sortable, forward-compatible with beans' `order: Aa` style)

### Semantics
- [ ] Null `before` + null `after` → first token (e.g. `"a0"`)
- [ ] Insert before first → lexicographically less than first
- [ ] Insert after last → lexicographically greater than last
- [ ] Insert between: deterministic midpoint; if collision possible, extend suffix
- [ ] Never produces an order equal to either neighbor

### Server default
- [ ] On `task.create` without explicit `order`, decider assigns `generateOrderBetween(null, firstOrderInColumn)` (top-of-column)

### Tests
- [ ] 10k random inserts: strictly ordered, no duplicates
- [ ] Worst-case nested inserts: order length stays under 32 chars
- [ ] Cross-platform stability: orders produced on Node match those produced in browser
