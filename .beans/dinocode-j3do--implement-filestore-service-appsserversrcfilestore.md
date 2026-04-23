---
# dinocode-j3do
title: Implement server FileStore adapter (apps/server/src/fileStore/)
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:12:43Z
updated_at: 2026-04-23T03:41:09Z
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

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
