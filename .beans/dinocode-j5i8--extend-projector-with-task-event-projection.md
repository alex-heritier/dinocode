---
# dinocode-j5i8
title: Extend projector with task event projection
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:12:22Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-y758
    - dinocode-8tuq
---

Handle task events in projector.ts: update OrchestrationReadModel and projection_tasks SQLite table. Idempotent insert+update paths.

## Subtasks

- [ ] Add `tasks: Map<TaskId, Task>` to `OrchestrationReadModel` in `projector.ts`
- [ ] Handle `task.created` event: insert into `tasks` map + INSERT into `projection_tasks`, compute initial ETag
- [ ] Handle `task.updated` event: merge patch into `tasks` map entry, UPDATE `projection_tasks` row, recompute ETag
- [ ] Handle `task.deleted` event: remove from `tasks` map, DELETE from `projection_tasks`
- [ ] Handle `task.archived` event: update `status` in map and DB, set archived flag
- [ ] Handle `task.unarchived` event: update `status` in map and DB
- [ ] Handle `task.conflict` event: store conflict marker in `tasks` map (for UI display)
- [ ] Ensure all handlers are idempotent (use UPSERT / INSERT OR REPLACE in SQLite)
- [ ] Run `bun run test` — projector snapshot tests pass
