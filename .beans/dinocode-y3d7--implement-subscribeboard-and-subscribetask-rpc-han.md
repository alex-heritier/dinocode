---
# dinocode-y3d7
title: Implement subscribeBoard and subscribeTask RPC handlers
status: completed
type: feature
priority: high
created_at: 2026-04-22T07:13:37Z
updated_at: 2026-04-22T14:56:17Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-afya
---

Server-side: build BoardSnapshot from projection_tasks + config, implement subscribeBoard/subscribeTask handlers in ws.ts, push incremental stream events.

## Subtasks

- [x] Board snapshot built from projection_tasks in ProjectionSnapshotQuery
- [x] Group tasks by status into `BoardColumn[]`, sort each column by `order` field
- [x] Collect `BoardDependency[]` from tasks' `blocking`/`blocked_by` fields
- [x] In `makeWsRpcLayer`, add `subscribeBoard` handler using `observeRpcStreamEffect`
- [x] On subscribe: push initial `BoardSnapshot` immediately, then push `BoardStreamEvent` on each task event
- [x] Map task events to card-upserted and card-removed BoardStreamEvent variants
- [x] Add `subscribeTask` handler: push initial task snapshot then stream task deltas
- [x] Handle subscriber disconnect gracefully (stream teardown)
- [x] Run `bun typecheck` — no new errors

## Summary of Changes

Implemented subscribeBoard handler in ws.ts: builds BoardSnapshot from projection_tasks, pushes initial snapshot then streams card-upserted/card-removed events. Implemented subscribeTask handler: pushes initial task snapshot then streams updated/deleted events. Both handlers use observeRpcStreamEffect pattern.
