---
# dinocode-8tuq
title: Extend decider with task command handling
status: completed
type: feature
priority: high
created_at: 2026-04-22T07:12:22Z
updated_at: 2026-04-22T14:55:55Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-8izj
---

Add task command invariants and decision logic in decider.ts and commandInvariants.ts. Pure functions only.

## Subtasks

- [x] Add `requireTask(taskId)` invariant in `commandInvariants.ts` — errors if task not in read model
- [x] Add `requireTaskAbsent(taskId)` invariant — errors if task already exists
- [x] Add `requireTaskNotArchived(taskId)` invariant
- [x] Handle `task.create` in `decideOrchestrationCommand`: validate title non-empty, validate parent/type hierarchy rules, emit `task.created` event
- [x] Handle `task.update` in `decideOrchestrationCommand`: requireTask, validate ETag if provided (compare to read model etag), emit `task.updated` event
- [x] Handle `task.delete` in `decideOrchestrationCommand`: requireTask, emit `task.deleted` event
- [x] Handle `task.archive` in `decideOrchestrationCommand`: requireTask + requireTaskNotArchived, emit `task.archived` event
- [x] Handle `task.unarchive`: requireTask (archived), emit `task.unarchived` event
- [ ] Add decider unit tests in `decider.test.ts` (deferred to soil test suite bean)
- [x] Run `bun typecheck` — passes

## Summary of Changes

All five task command handlers implemented in decider.ts (task.create, task.update, task.delete, task.archive, task.unarchive). Added requireTask, requireTaskAbsent, requireTaskNotArchived invariant functions in commandInvariants.ts. Invariant checks wired into update/delete/archive/unarchive handlers. Tests deferred to soil test suite bean.
