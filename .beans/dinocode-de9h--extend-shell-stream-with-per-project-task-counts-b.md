---
# dinocode-de9h
title: Extend shell stream with per-project task counts + badges
status: todo
type: feature
priority: normal
tags:
  - phase-5
  - performance
created_at: 2026-04-22T07:39:09Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-b6x6
---

The existing `orchestration.subscribeShell` (sidebar summary) must include compact task statistics so the sidebar can display counts (e.g. "Board (12)") without subscribing to the full board stream. Resolves the open question in DINOCODE.md §12.6.

## Subtasks

### Schema

- [ ] Extend `OrchestrationProjectShell` with `taskCounts: { total, inProgress, todo, draft, completed, scrapped, blocked, unblockedRecently }`
- [ ] Extend `OrchestrationShellStreamEvent` with `project-task-counts-updated` variant: `{ projectId, taskCounts }`

### Projector

- [ ] Maintain a per-project task-count aggregate in read model
- [ ] Recompute on every task event, emit shell event with debounce (100ms)
- [ ] Incremental: update counters by `±1`, don't recount full column each event

### Sidebar UI

- [ ] Board link in sidebar: `Board [12]`; badge color reflects urgency (red if > 0 unblocked-recently)
- [ ] Tooltip shows breakdown: "8 todo, 3 in progress, 1 blocked"

### Tests

- [ ] 100 tasks fixture: counts match actual SQL query
- [ ] Counts live-update on task.create/update/delete within 250ms

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
