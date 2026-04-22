---
# dinocode-j5i8
title: Extend projector with task event projection
status: completed
type: feature
priority: high
created_at: 2026-04-22T07:12:22Z
updated_at: 2026-04-22T14:56:28Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-y758
  - dinocode-8tuq
---

Handle task events in projector.ts: update OrchestrationReadModel and projection_tasks SQLite table. Idempotent insert+update paths.

## Subtasks

- [x] Add `tasks` array to `OrchestrationReadModel` in `projector.ts`
- [x] Handle `task.created` event: insert into `tasks` array + INSERT into `projection_tasks`
- [x] Handle `task.updated` event: merge patch into `tasks` array entry, UPDATE `projection_tasks` row
- [x] Handle `task.deleted` event: remove from `tasks` array, DELETE from `projection_tasks`
- [x] Handle `task.archived` event: pass through (status change via task.updated)
- [x] Handle `task.unarchived` event: pass through (status change via task.updated)
- [x] Handle `task.conflict` event: pass-through (conflict events handled at reactor layer)
- [x] Ensure all handlers are idempotent (INSERT OR REPLACE used in ProjectionTasks layer)
- [x] Run `bun typecheck` — passes

## Summary of Changes

Extended projector.ts with task event handlers: task.created inserts into tasks array, task.updated merges patch (filtering undefined values), task.deleted removes from array, task.archived/unarchived pass through. ProjectionTasks layer handles SQLite persistence with INSERT OR REPLACE for idempotency. Projection pipeline wired to persist tasks on each event.
