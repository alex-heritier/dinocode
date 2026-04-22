---
# dinocode-b3nv
title: Dependency edge overlay (SVG) on kanban board
status: todo
type: feature
priority: normal
tags:
  - phase-2
  - visualization
created_at: 2026-04-22T07:33:51Z
updated_at: 2026-04-22T07:33:51Z
parent: dinocode-lsa5
---

Render directed edges between cards to visualize `blocking`/`blocked_by` dependencies. SVG absolutely positioned over the board; edges update live as cards move.

## Subtasks

### Component

- [ ] Create `apps/web/src/components/board/DependencyOverlay.tsx`
- [ ] Absolutely positioned SVG covering the scrollable board region; `pointer-events: none` so it doesn't block drag
- [ ] Edges drawn as cubic Bezier curves from source card's right edge to target card's left edge (best-case routing)

### Geometry

- [ ] Each `KanbanCard` registers its bounding box via `ResizeObserver` into a shared context `BoardGeometryContext`
- [ ] Overlay subscribes to geometry context; re-renders edges on change (RAF-throttled)
- [ ] Handle scroll: edges follow board scroll position
- [ ] Handle column collapse: edges route to column header when target is collapsed

### Edge styling

- [ ] Base stroke: 1.5px, subtle neutral color
- [ ] Hover a card → edges touching that card highlight (accent color, 2.5px)
- [ ] Blocked edges (target not completed) → solid line; resolved edges → dashed, dimmed
- [ ] Arrowhead marker at the target end

### Performance

- [ ] Skip edges whose endpoints are offscreen (IntersectionObserver gate)
- [ ] Only re-render changed edges, not the entire SVG, when one card moves
- [ ] Benchmark: 200 cards with 500 edges at 60fps on M1

### Settings

- [ ] Toggle: "Show dependencies" boolean in board header; default on; persists in `desktopSettings`
