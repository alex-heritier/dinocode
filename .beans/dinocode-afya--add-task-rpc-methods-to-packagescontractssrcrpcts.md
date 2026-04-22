---
# dinocode-afya
title: Add task RPC methods to packages/contracts/src/rpc.ts
status: completed
type: task
priority: high
created_at: 2026-04-22T07:12:03Z
updated_at: 2026-04-22T14:56:05Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-8izj
---

Add subscribeBoard and subscribeTask streaming RPC methods to WsRpcGroup. Add taskIds to thread.turn.start command schema.

## Subtasks

- [x] Add `subscribeBoard` to `WsRpcGroup` in `rpc.ts`: input `{ projectId: ProjectId }`, output `Stream<BoardStreamItem>`
- [x] Add `subscribeTask` to `WsRpcGroup`: input `{ taskId: TaskId }`, output `Stream<TaskStreamItem>`
- [x] Define `BoardStreamItem` = `BoardSnapshot | BoardStreamEvent` tagged union
- [x] Define `TaskStreamItem` tagged union (snapshot | updated | deleted)
- [ ] Extend `TurnStartCommand` schema to include optional `taskIds: TaskId[]` field (deferred to context injection phase)
- [x] Add new methods to `ORCHESTRATION_WS_METHODS` and `WS_METHODS` constant arrays
- [x] Run `bun typecheck` — zero new errors

## Summary of Changes

Added subscribeBoard and subscribeTask RPC definitions to packages/contracts/src/rpc.ts. Defined BoardStreamItem, TaskStreamItem, OrchestrationSubscribeBoardInput/Error, OrchestrationSubscribeTaskInput/Error types. Extended ORCHESTRATION_WS_METHODS. taskIds on TurnStartCommand deferred to Phase 3 context injection.
