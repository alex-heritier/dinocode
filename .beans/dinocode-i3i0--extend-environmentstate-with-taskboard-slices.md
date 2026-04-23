---
# dinocode-i3i0
title: Extend EnvironmentState with task/board slices
status: todo
type: task
priority: high
created_at: 2026-04-22T07:13:37Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-afya
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

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
