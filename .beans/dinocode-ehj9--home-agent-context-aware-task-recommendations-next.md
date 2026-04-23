---
# dinocode-ehj9
title: "Home agent: context-aware task recommendations (next-up queue)"
status: todo
type: task
priority: low
tags:
  - phase-5
  - home-agent
created_at: 2026-04-22T07:39:09Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-b6x6
---

The home agent should proactively surface "what to work on next" based on priority, blockers, and recency.

## Subtasks

- [ ] Server util `computeRecommendedTasks(projectId): TaskId[]` in `apps/server/src/homeAgent/`
- [ ] Scoring: unblocked > critical > high > in-progress > recently-updated; penalty for tasks older than N days in draft
- [ ] Expose as a new built-in tool `dinocode_recommend_next` returning top 5
- [ ] Home agent UI: "Suggested next: [task chips]" below input when idle
- [ ] Refresh suggestions when board changes (debounced 500ms)
- [ ] Tests: deterministic ordering for fixture project

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
