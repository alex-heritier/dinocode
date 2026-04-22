---
# dinocode-e58v
title: Performance benchmarks + budgets (board render, watcher throughput)
status: todo
type: task
priority: normal
tags:
  - performance
created_at: 2026-04-22T07:41:25Z
updated_at: 2026-04-22T07:41:25Z
parent: dinocode-xd5m
---

Ship with measured performance characteristics and guardrails in CI.

## Subtasks

### Benchmark suite

- [ ] `scripts/bench/board-render.ts` — render 100/500/2000 cards, measure FPS with synthetic scroll + drag
- [ ] `scripts/bench/watcher-throughput.ts` — write 1000 files in parallel, measure time to projection converge
- [ ] `scripts/bench/context-injection.ts` — format 10/50/100 tasks into prompt, measure ms + tokens

### Budgets

- [ ] Board render: 500 cards initial render < 250ms P95; scroll at 60fps
- [ ] Command dispatch: P95 < 20ms (in-memory); external file edit → UI update P95 < 200ms
- [ ] Context injection for 10 tasks: < 10ms

### CI integration

- [ ] Run nightly on a fixed runner class
- [ ] Regressions >20% open a ticket automatically
