---
# dinocode-j3do
title: Implement server FileStore adapter (apps/server/src/fileStore/)
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:12:43Z
updated_at: 2026-04-22T12:49:04Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-8izj
---

Thin server-side FileStore layer that wraps `packages/soil` for orchestration use. Server-specific concerns stay here: Effect layer wiring, startup bootstrap, filesystem watch lifecycle, and error mapping.

## Subtasks

- [ ] Create `apps/server/src/fileStore/FileStore.ts` service interface + `Effect.Tag`
- [ ] Create `apps/server/src/fileStore/FileStoreLive.ts` thin adapter layer
- [ ] Delegate config loading, parsing, rendering, ETag handling, and path utilities to `packages/soil`
- [ ] Keep server-only IO in the adapter: `fs.watch` lifecycle, background fibers, startup resource cleanup
- [ ] Expose `loadProject`, `writeTask`, and `watchProject` in terms expected by orchestration services
- [ ] Map soil errors into server-facing tagged errors/logging fields without losing stable discriminators
- [ ] Add adapter-focused tests covering soil delegation + watcher lifecycle behavior
- [ ] Wire the adapter layer into `apps/server/src/server.ts`
