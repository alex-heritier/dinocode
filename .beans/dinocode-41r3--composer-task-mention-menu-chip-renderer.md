---
# dinocode-41r3
title: 'Composer: @TASK- mention menu + chip renderer'
status: todo
type: task
priority: normal
created_at: 2026-04-23T04:39:33Z
updated_at: 2026-04-23T04:39:33Z
parent: dinocode-qsqf
---

Add `@TASK-` to the composer's mention menu so users can fuzzy-search the current project's tasks and insert a live chip.

## Implementation

- Extend mention-menu data source to include current-project tasks as a "Tasks" section.
- Item shape: `{ id, title, status, priority }`. Keyed by `dinocode-xxxx`.
- Inserted token: `@TASK-<id>` with a Lexical decorator node that renders a clickable chip:
  ```
  < <title> >
    [status] [\u2318-click opens card]
  ```
- Cmd/Ctrl+click opens the task detail slide-over (even if user is not on the board).
- Chip markdown serialization: `[@TASK-<id>](dinocode://task/<id>)` so the URL is stable across copy/paste and message history.

## Acceptance

- `@TASK-` in composer shows filtered task list.
- Selecting inserts a working chip.
- Clicking chip (with modifier) opens detail slide-over.
- Message round-trips correctly across reload.
