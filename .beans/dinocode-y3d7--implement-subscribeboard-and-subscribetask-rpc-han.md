---
# dinocode-y3d7
title: Implement subscribeBoard and subscribeTask RPC handlers
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:13:37Z
updated_at: 2026-04-22T09:55:25Z
parent: dinocode-lsa5
blocked_by:
    - dinocode-afya
---

Server-side: build BoardSnapshot from projection_tasks + config, implement subscribeBoard/subscribeTask handlers in ws.ts, push incremental stream events.

## Subtasks

- [ ] Create `buildBoardSnapshot(tasks: Task[], config: ProjectConfig): BoardSnapshot` pure function
- [ ] Group tasks by status into `BoardColumn[]`, sort each column by `order` field
- [ ] Collect `BoardDependency[]` from all tasks' `blocking`/`blocked_by` fields
- [ ] In `makeWsRpcLayer`, add `subscribeBoard` handler using `observeRpcStreamEffect`
- [ ] On subscribe: push initial `BoardSnapshot` immediately, then push `BoardStreamEvent` on each task event
- [ ] Map each `TaskEvent` to the appropriate `BoardStreamEvent` variant (card-added, card-updated, card-moved, card-removed)
- [ ] Add `subscribeTask` handler: push initial `Task` then stream `TaskEvent` deltas for that taskId
- [ ] Handle subscriber disconnect gracefully (stream teardown)
- [ ] Run `bun typecheck` — no new errors
