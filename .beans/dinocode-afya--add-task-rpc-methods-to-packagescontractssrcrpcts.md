---
# dinocode-afya
title: Add task RPC methods to packages/contracts/src/rpc.ts
status: todo
type: task
priority: high
created_at: 2026-04-22T07:12:03Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-8izj
---

Add subscribeBoard and subscribeTask streaming RPC methods to WsRpcGroup. Add taskIds to thread.turn.start command schema.

## Subtasks

- [ ] Add `subscribeBoard` to `WsRpcGroup` in `rpc.ts`: input `{ projectId: ProjectId }`, output `Stream<BoardStreamItem>`
- [ ] Add `subscribeTask` to `WsRpcGroup`: input `{ taskId: TaskId }`, output `Stream<TaskStreamItem>`
- [ ] Define `BoardStreamItem` = `BoardSnapshot | BoardStreamEvent` tagged union
- [ ] Define `TaskStreamItem` = `Task | TaskEvent` tagged union
- [ ] Extend `TurnStartCommand` schema to include optional `taskIds: TaskId[]` field
- [ ] Add new methods to `ORCHESTRATION_WS_METHODS` and `WS_METHODS` constant arrays
- [ ] Run `bun typecheck` — zero new errors
