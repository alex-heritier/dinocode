---
# dinocode-6uwn
title: Implement server task-file reactor integration
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:13:15Z
updated_at: 2026-04-23T03:41:09Z
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

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
