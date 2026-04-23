---
# dinocode-me51
title: Persist thread -> tasks association (projection + migration)
status: todo
type: task
priority: high
tags:
  - phase-3
  - persistence
created_at: 2026-04-22T07:35:20Z
updated_at: 2026-04-23T03:41:09Z
parent: dinocode-0apu
blocked_by:
  - dinocode-56yo
---

The set of tasks referenced by a thread must be queryable (for "threads that touched this task" UI and for home-agent recommendations). Store as a projection table and keep it in sync via the projector.

## Subtasks

- [ ] SQLite migration `NNN_ProjectionThreadTasks.ts`: `(thread_id TEXT, task_id TEXT, first_turn_id TEXT, last_seen_turn_id TEXT, created_at TEXT, PRIMARY KEY(thread_id, task_id))`
- [ ] Index on `task_id` for reverse lookup
- [ ] Projector handles `thread.turn-start-requested`: if `taskIds` present, upsert rows
- [ ] Add `referencedTaskIds: TaskId[]` field to `OrchestrationThread` schema
- [ ] TaskDetailPanel "Activity" tab shows: "Referenced in threads: [thread links]"
- [ ] Add RPC `orchestration.listThreadsReferencingTask({ taskId })` for the detail panel
- [ ] Tests: single thread with 3 tasks, 3 threads with 1 task, delete thread cascades rows

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
