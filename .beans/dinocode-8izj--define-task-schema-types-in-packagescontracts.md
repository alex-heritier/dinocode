---
# dinocode-8izj
title: Define task schema types in packages/contracts
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:11:45Z
updated_at: 2026-04-22T07:11:57Z
parent: dinocode-x8dw
---

All Effect/Schema types needed for tasks: branded IDs, status/type/priority enums, Task schema, command/event unions, board types.

## Subtasks

- [ ] Add `TaskId`, `ProjectId` branded string types via `Schema.brand`
- [ ] Add `TaskStatus` literal union: `in-progress | todo | draft | completed | scrapped`
- [ ] Add `TaskType` literal union: `milestone | epic | bug | feature | task`
- [ ] Add `TaskPriority` literal union: `critical | high | normal | low | deferred`
- [ ] Add `Task` schema with all fields (id, slug, title, status, type, priority, tags, created_at, updated_at, order, parent, blocking, blocked_by, body)
- [ ] Add `TaskPatch` schema (all Task fields optional except id)
- [ ] Add `TaskCommand` union: `task.create | task.update | task.delete | task.archive | task.unarchive`
- [ ] Add `TaskEvent` union: `task.created | task.updated | task.deleted | task.archived | task.unarchived | task.conflict`
- [ ] Add `BoardCard`, `BoardColumn`, `BoardDependency`, `BoardSnapshot` types
- [ ] Add `BoardStreamEvent` discriminated union (card-added, card-updated, card-moved, card-removed)
- [ ] Extend `OrchestrationCommand` union to include `TaskCommand`
- [ ] Extend `OrchestrationEvent` union to include `TaskEvent`
- [ ] Export all new types from `packages/contracts/src/orchestration.ts` (no barrel)
- [ ] Run `bun typecheck` — zero new errors
