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
updated_at: 2026-04-23T03:41:20Z
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

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
