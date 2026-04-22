---
# dinocode-w1uo
title: Add kanban board route
status: todo
type: task
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T09:55:22Z
parent: dinocode-lsa5
blocked_by:
    - dinocode-sizc
---

Add the kanban board route at `apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx`. Wires the board subscription, mounts `KanbanBoard`, handles loading / empty / error states.

## Subtasks

- [ ] Create file using `createFileRoute` pattern matching existing `_chat.*` routes
- [ ] Route params: `environmentId`, `projectId`
- [ ] Route loader: pre-fetch project metadata (title, workspaceRoot) via existing projects RPC
- [ ] Initiate `subscribeBoard` stream on mount; tear down on unmount
- [ ] Loading skeleton: 4 column placeholders with pulse animation
- [ ] Empty state: if `.dinocode/` missing → render `<DinocodeInitBanner />` (see dinocode-y6pg)
- [ ] Error state: transport error → toast + retry button
- [ ] Register in `routeTree.gen` via TanStack Router auto-generation (run route-gen script in post-install)
- [ ] Add sidebar navigation: "Board" tab next to "Threads" with task-count badge (covered in shell-stream task counts task)
- [ ] Route search params: `?filter=status:in-progress,type:bug&search=auth` preserved in URL so reloads keep state
- [ ] Wire keyboard shortcut `G B` (go to board) via existing keybindings system

## Acceptance
- [ ] Navigate to `/env/<id>/project/<id>/board` renders kanban
- [ ] Back/forward buttons preserve filter state
- [ ] No `bun lint` / `bun typecheck` errors
