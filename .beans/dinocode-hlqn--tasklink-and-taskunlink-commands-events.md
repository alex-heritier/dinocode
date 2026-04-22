---
# dinocode-hlqn
title: task.link and task.unlink commands + events
status: todo
type: feature
priority: normal
tags:
  - phase-5
  - contracts
created_at: 2026-04-22T07:38:56Z
updated_at: 2026-04-22T07:38:56Z
parent: dinocode-b6x6
blocked_by:
  - dinocode-8tuq
---

The current contracts only expose `task.update` for relationship edits. Add dedicated `task.link` / `task.unlink` commands so linking becomes a first-class, atomic operation with clean audit trail and simpler reactor handling.

## Subtasks

### Contracts

- [ ] Add `TaskLinkCommand`: `{ type: "task.link", commandId, fromTaskId, toTaskId, createdAt }`
- [ ] Add `TaskUnlinkCommand`: `{ type: "task.unlink", commandId, fromTaskId, toTaskId, createdAt }`
- [ ] Add `task.linked` / `task.unlinked` events with payload `{ fromTaskId, toTaskId }`
- [ ] Extend `OrchestrationCommand` and `OrchestrationEvent` unions

### Decider

- [ ] `requireTask` for both sides
- [ ] Reject if same id (`fromTaskId === toTaskId`)
- [ ] Cycle check: BFS over existing `blocking` graph; reject with `CycleError` if adding `from→to` creates a cycle
- [ ] Idempotent: link already-linked emits nothing (or an `already-linked` no-op event, TBD)

### Projector

- [ ] Update both tasks' `blocking` / `blocked_by` arrays atomically
- [ ] Keep arrays sorted for deterministic file writes

### FileStoreReactor

- [ ] On `task.linked` / `task.unlinked`: `writeTask` for both source and target in the same batch
- [ ] Coalesce with other updates in the same event tick to avoid double-writes

### Migration

- [ ] Existing code paths dispatching `task.update` with changed `blocking`/`blocked_by` should transparently redirect to the new commands (or stay allowed; documented decision)

### Tests

- [ ] Link happy path; cycle rejection; idempotent re-link
