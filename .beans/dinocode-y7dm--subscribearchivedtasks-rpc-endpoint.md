---
# dinocode-y7dm
title: subscribeArchivedTasks RPC endpoint
status: todo
type: task
priority: normal
created_at: 2026-04-22T09:56:01Z
updated_at: 2026-04-22T09:56:15Z
parent: dinocode-lsa5
---

Add subscribeArchivedTasks({ projectId }) to contracts, server ws handler, and push archived task list (cursor-paginated) to subscribers. Required by the archive view route.

## Subtasks

- [ ] Add `subscribeArchivedTasks` to `packages/contracts/src/rpc.ts` with input `{ projectId, limit?, cursor? }` and output stream type `ArchivedTaskPage`
- [ ] Add `ArchivedTaskPage` schema to contracts: `{ tasks: Task[], nextCursor: string | null, total: number }`
- [ ] Wire handler in `apps/server/src/wsServer.ts` via `observeRpcStreamEffect`
- [ ] Handler queries `projection_tasks` where `is_archived = 1` (reads from `.dinocode/tasks/archive/` watcher output)
- [ ] Cursor-based pagination: sort by `archived_at DESC`, 50 per page
- [ ] Push incremental updates when archive changes (file watcher emits)
- [ ] Run `bun typecheck` — no new errors
