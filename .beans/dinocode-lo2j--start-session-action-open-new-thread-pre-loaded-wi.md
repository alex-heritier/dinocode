---
# dinocode-lo2j
title: "Start Session action: open new thread pre-loaded with task context"
status: todo
type: task
priority: high
created_at: 2026-04-23T04:39:12Z
updated_at: 2026-04-23T04:39:12Z
parent: dinocode-qsqf
---

Primary bridge from board \u2192 chat. A card's Start Session action opens a new thread whose first composer draft includes the task title, body, blockers, and an `@TASK-<id>` mention bound to the task.

## Implementation

- New client helper `apps/web/src/components/board/startTaskSession.ts`:
  - Input: `{ environmentId, projectId, task: BoardCard-or-TaskDocument }`.
  - Side effects: create a draft thread via existing `startNewThreadFromContext` path (see `lib/chatThreadActions.ts`), with a pre-filled draft containing:

    ```
    ## Task: <title>  (@TASK-<id>)
    Status: <status>  |  Priority: <priority>
    Blocked by: <list>

    <body>
    ```

  - Navigate to the new thread.
  - Store the `taskId` binding on the thread (see dinocode-h41x). Until that lands, pass the ID through the draft metadata so it round-trips.

- Hooked up from:
  - Task Detail slide-over primary button (dinocode-xjal).
  - `\u2318\u23ce` keyboard shortcut on the board when a card is focused / selected.

## Acceptance

- Clicking Start Session opens a new thread in the same project.
- Draft is pre-populated with task title + body + blockers.
- Thread is recognized as bound to the task after dinocode-h41x ships; until then, composer text includes a stable `@TASK-<id>` token so users can still navigate.
- Graceful error if project has no env (shouldn't happen, but guard).
