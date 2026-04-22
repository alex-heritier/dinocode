---
# dinocode-aa8u
title: Kanban virtualization for large boards (500+ tasks)
status: todo
type: task
priority: low
tags:
    - phase-6
    - performance
created_at: 2026-04-22T07:40:10Z
updated_at: 2026-04-22T07:40:10Z
parent: dinocode-0ub1
---

Keep the board smooth when a project has hundreds of tasks per column. Drop-in virtualization for cards without breaking drag-and-drop.

## Subtasks

- [ ] Evaluate `@tanstack/react-virtual` vs `react-virtuoso` compatibility with `@dnd-kit`
- [ ] Virtualize column card list only when `cards.length > 100`
- [ ] Preserve drag offscreen: when dragging, temporarily render cards outside virtual window
- [ ] Preserve focus when scrolling brings a focused card in/out of the viewport
- [ ] Benchmarks: 2000-card column scrolls at 60fps on M1 / i7 thinkpad
- [ ] Feature flag: `performance.virtualizedBoard` in `desktopSettings`, default on
