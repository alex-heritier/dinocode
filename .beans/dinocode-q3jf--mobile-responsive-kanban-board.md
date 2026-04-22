---
# dinocode-q3jf
title: Mobile-responsive kanban board
status: todo
type: task
priority: low
created_at: 2026-04-22T07:15:45Z
updated_at: 2026-04-22T07:39:51Z
parent: dinocode-0ub1
---

Make the kanban board usable on narrow viewports without sacrificing desktop ergonomics.

## Subtasks

### Layout

- [ ] Breakpoint `< 768px`: single-column stacked view with tab-bar at top to switch status
- [ ] Breakpoint `768..1024px`: horizontal scroll with snap-points per column
- [ ] Breakpoint `> 1024px`: current multi-column layout

### Touch

- [ ] Use `@dnd-kit/core` PointerSensor with long-press activation (250ms) for mobile
- [ ] Larger hit targets on cards: min 44×44 for close/"+" buttons
- [ ] Momentum-scroll columns; prevent body scroll while dragging

### Sidebar

- [ ] Sidebar becomes an off-canvas drawer below 768px
- [ ] Hamburger toggle in board header
- [ ] Dismiss on card click

### Task detail panel

- [ ] Slides in as full-screen sheet on mobile
- [ ] Back button returns to board; URL state preserved

### PWA / standalone

- [ ] Add `manifest.json` so the web app can be installed on mobile home screens
- [ ] Test iOS Safari + Android Chrome layout and touch

### Tests

- [ ] Visual regression via Playwright screenshots at 3 viewport widths
- [ ] Touch drag simulation passes
