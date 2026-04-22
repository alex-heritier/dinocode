---
# dinocode-6uwn
title: Implement FileStoreReactor
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:13:15Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-j3do
    - dinocode-j5i8
---

Reactor that writes task files after orchestration events commit. Handles create/update/delete/archive/unarchive. Uses ignore Set to prevent watcher re-entry. Registered in OrchestrationReactor.ts.

## Subtasks

- [ ] Create `apps/server/src/orchestration/Services/FileStoreReactor.ts` — service interface
- [ ] Create `apps/server/src/orchestration/Layers/FileStoreReactor.ts` — Layer implementation
- [ ] Subscribe to committed orchestration events via `OrchestrationEngine` event bus
- [ ] On `task.created`: call `FileStore.writeTask(task)` (no ETag, new file)
- [ ] On `task.updated`: call `FileStore.writeTask(task, currentEtag)` with ETag from read model
- [ ] On `task.deleted`: delete `tasks/<id>--<slug>.md` file (add to ignore Set first)
- [ ] On `task.archived`: move file from `tasks/` → `tasks/archive/` (add both paths to ignore Set)
- [ ] On `task.unarchived`: move file from `tasks/archive/` → `tasks/` (add both paths to ignore Set)
- [ ] All file operations: wrap in `Effect.ensuring` to clear ignore Set even on error
- [ ] Register `FileStoreReactorLive` in `OrchestrationReactor.ts` startup sequence
- [ ] Wire `FileStoreLive` layer in `apps/server/src/server.ts`
- [ ] Integration test: create task via RPC → file appears on disk with correct content
