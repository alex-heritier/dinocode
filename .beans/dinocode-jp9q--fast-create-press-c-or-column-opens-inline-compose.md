---
# dinocode-jp9q
title: 'Fast create: press ''c'' or column ''+'' opens inline composer'
status: todo
type: task
priority: normal
created_at: 2026-04-23T04:39:58Z
updated_at: 2026-04-23T04:39:58Z
parent: dinocode-qsqf
---

Replace the current top-of-board `TaskCreateForm` with two fast-create affordances:

1. Pressing `c` anywhere on the board \u2192 inline composer appears at the top of the focused column (default: `todo` if nothing focused).
2. Small `+` at the bottom of each column.

## Design

- Single text input; status inferred from column (no dropdown visible).
- `Tab` progressively reveals `type` and `priority` dropdowns.
- `Enter` submits; `Shift+Enter` submits and reopens for rapid entry.
- `Esc` cancels, preserving any typed draft in local state for 30s so accidental closes don't lose work.
- Optimistic: a "pending" card renders immediately; rolls back on error.

## Implementation

- Component `apps/web/src/components/board/InlineQuickCreate.tsx` replaces `TaskCreateForm.tsx` in the board route.
- Per-column `+` renders the same component inline.
- Track "focused column" in board route state (keyboard `\u2190/\u2192` also moves focus).

## Acceptance

- Pressing `c` anywhere on board focuses the composer in the right column.
- Enter creates; Shift+Enter rapid-creates; Esc cancels.
- Optimistic card visible instantly.
- `bun fmt && bun lint && bun typecheck && bun run test` green.
