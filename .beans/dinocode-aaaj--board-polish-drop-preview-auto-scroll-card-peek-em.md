---
# dinocode-aaaj
title: 'Board polish: drop preview, auto-scroll, card peek, empty state'
status: todo
type: task
priority: normal
created_at: 2026-04-23T04:40:20Z
updated_at: 2026-04-23T04:40:20Z
parent: dinocode-qsqf
---

Final coat of polish for the board.

## Drop preview
- When dragging over a column, show a ghost insertion slot at the target position (not just tint the whole column).
- Implementation: `useDndMonitor` \u2192 track `over + activatorEvent` offset \u2192 compute insertion index \u2192 render a thin divider between cards at that index.

## Auto-scroll
- When dragging near top/bottom 40px of a column's scroll area, auto-scroll that column.
- Use dnd-kit's `AutoScroll` modifier or a custom hook driven by the active drag.

## Card hover peek
- Hover a card for 200ms \u2192 small right rail peeks with its body markdown (first 200 chars) + bound thread count + blocker list.
- Esc or move-away dismisses.

## Empty state
Replace current "columns with an always-visible form" with:

```
This project has no tasks yet.

  Press  c  to add your first task
  or \u2318\u21e7K  to search across projects
  or /task in any chat to file one from a conversation

Tip: Tasks live as markdown files in .dinocode/tasks/ \u2014 they go
in git with your code.
```

## Acceptance

- Drop preview appears and is accurate.
- Auto-scroll works at 60fps while dragging.
- Hover peek renders within 200ms, dismisses cleanly.
- Empty state renders when project has 0 tasks.
- `bun fmt && bun lint && bun typecheck && bun run test` green.
