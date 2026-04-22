---
# dinocode-xd4c
title: Integrate FileStore watcher with orchestration engine
status: todo
type: task
priority: high
created_at: 2026-04-22T07:13:15Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-6uwn
---

Consume watchProject stream at server startup. Parse change events, compute ETag, dispatch task.update commands back into OrchestrationEngineService. Handle delete and archive moves.

## Subtasks

- [ ] At server startup, call `FileStore.loadProject(workspaceRoot)` → seed orchestration read model from disk
- [ ] Start `FileStore.watchProject(workspaceRoot)` stream in a background fiber
- [ ] On `FileChangeEvent { type: 'modified' }`: read file, parse, compute ETag, dispatch `task.update` command
- [ ] On `FileChangeEvent { type: 'deleted' }`: dispatch `task.delete` command (with ETag check skipped for delete)
- [ ] On `FileChangeEvent { type: 'moved' }` into archive/: dispatch `task.archive` command
- [ ] On `FileChangeEvent { type: 'moved' }` out of archive/: dispatch `task.unarchive` command
- [ ] If ETag validation fails on dispatch: server emits `task.conflict` event, does NOT write file again
- [ ] Log all watcher dispatches at DEBUG level
- [ ] Handle watcher fiber errors with exponential backoff restart
