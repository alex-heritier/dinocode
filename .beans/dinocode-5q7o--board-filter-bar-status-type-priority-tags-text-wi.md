---
# dinocode-5q7o
title: Board filter bar (status, type, priority, tags, text) with URL sync
status: todo
type: feature
priority: normal
tags:
  - phase-2
  - ui
created_at: 2026-04-22T07:34:00Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-lsa5
---

Structured filter bar above the columns. Filters are applied client-side against the already-subscribed `BoardSnapshot`. State lives in URL search params so refreshes, deep links, and browser back/forward all work.

## Subtasks

### Component

- [ ] `apps/web/src/components/board/BoardFilterBar.tsx`
- [ ] Structured pill-style filters: `status: [...]`, `type: [...]`, `priority: [...]`, `tag: [...]`
- [ ] Free-text search field (filters title + body, case-insensitive, debounced 150ms)
- [ ] "Clear all" button when any filter active

### URL sync

- [ ] Use TanStack Router `useSearch` + `useNavigate({ search: ... })`
- [ ] Serialize filters as `?status=todo,in-progress&type=bug&tag=auth,backend&q=oauth`
- [ ] Parse on mount; update URL on change (replace, not push, so back-button doesn't spam history)

### Selectors

- [ ] Memoized selector `selectFilteredBoard(boardColumns, filters)` in `apps/web/src/store.ts`
- [ ] Structural-equality return so columns only re-render when their filtered cards list changes

### Empty filter state

- [ ] When filters produce zero cards, show inline message: "No tasks match these filters. [Clear filters]"

### Tests

- [ ] Each individual filter dimension
- [ ] Combined filters are AND across dimensions, OR within a dimension
- [ ] URL round-trip: write filters → navigate away → return → filters restored

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
