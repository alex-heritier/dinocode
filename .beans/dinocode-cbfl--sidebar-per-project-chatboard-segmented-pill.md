---
# dinocode-cbfl
title: 'Sidebar: per-project Chat/Board segmented pill'
status: todo
type: task
priority: high
created_at: 2026-04-23T04:38:16Z
updated_at: 2026-04-23T04:38:16Z
parent: dinocode-qsqf
---

Make the board a first-class navigation target from the sidebar so users never have to remember a URL.

## Design

Inside `SidebarProjectItem`, just below the project header row (name + chevron), render a small pill with two segments: `Chat · N` and `Board · M`.

- Chat segment → navigates to the project's most-recently-visited thread (fallback: newest thread; fallback: new-thread composer pre-filled).
- Board segment → navigates to `/board/$environmentId/$projectId`.
- Active face has inset background + bold text so current view is obvious.
- Counts: open threads (chat), tasks in `todo` + `in-progress` (board). Muted when zero.
- Pill is ~20px tall; no visible impact on sidebar density when collapsed.
- Keyboard: the pill is tab-navigable; `Enter` activates.
- Works across all three sidebar modes (expanded, collapsed-rail, manual sorting).

## Integration

- The board count is available via the existing `useBoardSubscription` *or* a lightweight variant that only counts (no card details). For now, piggyback on `environmentStateById` if it already tracks task counts, otherwise lazy-subscribe on sidebar render.
- Keep it in `apps/web/src/components/Sidebar.tsx` as a minimal integration point; logic (face resolution, count selector) lives in a new module `apps/web/src/components/board/projectFace.ts` so it can be moved to `packages/dinocode-board` later.

## Acceptance

- Pill renders in every project row.
- Clicking Board navigates to the correct board URL.
- Clicking Chat navigates to the last-visited thread; falls back gracefully for new projects.
- Active face visually distinct.
- Test: unit test for face resolution logic (pure function).
- `bun fmt && bun lint && bun typecheck && bun run test` green.
