---
# dinocode-8izj
title: Define task schema types in packages/contracts
status: completed
type: feature
priority: high
created_at: 2026-04-22T07:11:45Z
updated_at: 2026-04-22T14:46:25Z
parent: dinocode-x8dw
---

All Effect/Schema types needed for tasks: branded IDs, status/type/priority enums, Task schema, command/event unions, board types.

## Subtasks

- [x] Add `TaskId`, `ProjectId` branded string types via `Schema.brand`
- [x] Add `TaskStatus` literal union: `in-progress | todo | draft | completed | scrapped`
- [x] Add `TaskType` literal union: `milestone | epic | bug | feature | task`
- [x] Add `TaskPriority` literal union: `critical | high | normal | low | deferred`
- [x] Add `Task` schema with all fields (id, slug, title, status, type, priority, tags, created_at, updated_at, order, parent, blocking, blocked_by, body)
- [x] Add `TaskPatch` schema (all Task fields optional except id)
- [x] Add `TaskCommand` union: `task.create | task.update | task.delete | task.archive | task.unarchive`
- [x] Add `TaskEvent` union: `task.created | task.updated | task.deleted | task.archived | task.unarchived | task.conflict`
- [x] Add `BoardCard`, `BoardColumn`, `BoardDependency`, `BoardSnapshot` types
- [x] Add `BoardStreamEvent` discriminated union (card-added, card-updated, card-moved, card-removed)
- [x] Extend `OrchestrationCommand` union to include `TaskCommand`
- [x] Extend `OrchestrationEvent` union to include `TaskEvent`
- [x] Export all new types from `packages/contracts/src/orchestration.ts` (no barrel)
- [x] Run `bun typecheck` — zero new errors

## Summary of Changes

All task-domain types defined in packages/contracts/src/orchestration.ts: TaskId, TaskStatus, TaskType, TaskPriority, Task, TaskPatch, TaskCommand variants (create/update/delete/archive/unarchive), TaskEvent variants, BoardCard, BoardColumn, BoardSnapshot, BoardStreamEvent, BoardStreamItem. OrchestrationCommand and OrchestrationEvent unions extended.
