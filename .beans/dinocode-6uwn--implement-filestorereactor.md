---
# dinocode-6uwn
title: Implement server task-file reactor integration
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:13:15Z
updated_at: 2026-04-22T12:49:04Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-j3do
    - dinocode-j5i8
---

Server-side reactor integration that uses Soil to project committed task events onto `.dinocode/tasks/` files. Keeps orchestration startup and event-bus wiring in the server while delegating task-file semantics to Soil.

## Subtasks

- [ ] Create `apps/server/src/orchestration/Services/FileStoreReactor.ts` service interface
- [ ] Create `apps/server/src/orchestration/Layers/FileStoreReactor.ts` layer implementation
- [ ] Subscribe to committed task events from the orchestration event pipeline
- [ ] Delegate create/update/delete/archive/unarchive file mutations to Soil reactor or Soil file-store helpers
- [ ] Preserve watcher ignore semantics so server-projected writes do not re-enter as external edits
- [ ] Ensure archive/unarchive moves are atomic and always clear ignore state on failure
- [ ] Register the reactor in `OrchestrationReactor.ts` startup sequence
- [ ] Add integration test: task event commit projects the expected file change on disk
