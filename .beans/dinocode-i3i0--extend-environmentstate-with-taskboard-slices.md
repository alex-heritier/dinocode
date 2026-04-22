---
# dinocode-i3i0
title: Extend EnvironmentState with task/board slices
status: todo
type: task
priority: high
created_at: 2026-04-22T07:13:37Z
updated_at: 2026-04-22T07:13:51Z
parent: dinocode-lsa5
---

Add taskSlice (tasks map) and boardSlice (columns array) to EnvironmentState in apps/web/src/store.ts. Add subscribeBoard RPC hook. Apply BoardStreamEvent reducer.

## Subtasks

- [ ] Add `tasks: Map<string, Task>` slice to `EnvironmentState`
- [ ] Add `boardColumns: BoardColumn[]` slice to `EnvironmentState`
- [ ] Add `selectedTaskId: string | null` to `EnvironmentState`
- [ ] Create `apps/web/src/rpc/boardSubscription.ts` — subscribe to `subscribeBoard` stream
- [ ] Apply `BoardSnapshot` as initial state (replace all tasks + columns)
- [ ] Apply `BoardStreamEvent` reducers: card-added, card-updated, card-moved (update status+order), card-removed
- [ ] Use structural equality checks before updating (prevent re-render loops)
- [ ] Subscribe in board route `useEffect`, unsubscribe on unmount
- [ ] Run `bun typecheck` — no new errors
