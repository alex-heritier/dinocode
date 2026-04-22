---
# dinocode-w1uo
title: Add kanban board route
status: completed
type: task
priority: high
created_at: 2026-04-22T07:14:00Z
updated_at: 2026-04-22T14:57:32Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-sizc
---

Add the kanban board route at `apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx`. Wires the board subscription, mounts `KanbanBoard`, handles loading / empty / error states.

## Subtasks

- [x] Create file using `createFileRoute` pattern matching existing `_chat.*` routes
- [x] Route params: `environmentId`, `projectId`
- [ ] Route loader (deferred — not needed for initial board rendering)
- [x] Initiate `subscribeBoard` stream on mount; tear down on unmount via `useBoardSubscription` hook
- [x] Loading state: centered "Loading board..." text
- [ ] DinocodeInitBanner empty state (deferred to initialization banner bean)
- [x] Error state: transport error → error message displayed
- [x] Register in `routeTree.gen` via TanStack Router auto-generation
- [ ] Sidebar Board tab (deferred to shell-stream task counts bean)
- [ ] URL search params filter sync (deferred to board filter bar bean)
- [ ] Keyboard shortcut G B (deferred to keyboard shortcuts bean)

## Acceptance

- [x] Navigate to `/env/<id>/project/<id>/board` renders kanban
- [ ] Back/forward filter state (deferred to board filter bar bean)
- [x] No `bun lint` / `bun typecheck` errors

## Summary of Changes

Created board route at \_chat.board.$environmentId.$projectId.tsx using createFileRoute. Wires useBoardSubscription hook for real-time board data. Shows loading state, error state, and renders KanbanBoard with card detail modal on click. Registered in routeTree.gen.ts. Advanced features (route loader, loading skeleton, init banner, sidebar tab, URL filter params, keyboard shortcuts) deferred to their respective beans.
