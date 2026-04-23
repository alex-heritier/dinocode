---
# dinocode-g5kl
title: "Dependency filter mode: show task's blocker graph"
status: todo
type: task
priority: low
created_at: 2026-04-23T04:40:36Z
updated_at: 2026-04-23T04:40:36Z
parent: dinocode-qsqf
---

Defer full edge-drawn dependency graphs by default. Instead add an opt-in "graph filter" mode:

- Badge on each card: `\u26d3 N` showing blocker count; click \u2192 filter the board to just that card's dependency subgraph (card + transitive blockers + blocked-by).
- Board header gets a small `Network` icon toggle that flips to "graph mode" (overlay-style, default off).
- Exit by clicking the X in the filter chip or pressing Esc.

## Acceptance

- Clicking the badge filters the board to the subgraph.
- Graph mode toggle overlays directed edges between cards.
- Esc clears the filter / exits graph mode.
