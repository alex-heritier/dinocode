---
# dinocode-1liz
title: "Composer: /task slash command files a task from the chat"
status: todo
type: task
priority: normal
created_at: 2026-04-23T04:39:24Z
updated_at: 2026-04-23T04:39:24Z
parent: dinocode-qsqf
---

Extend the composer slash-command menu so typing `/task <title>` files a task into the current project's board and inserts `@TASK-<id>` at the cursor.

## Implementation

- Register a new command in `apps/web/src/components/chat/composerSlashCommandSearch.ts` (or its newer neighbor).
- Handler:
  1. Resolve current project (from active thread) — bail with toast if none.
  2. Dispatch `task.create` via `readEnvironmentApi(env).orchestration.dispatchCommand({ type: "task.create", ... })` with `status: "todo"`, `priority: "normal"`, `title: <rest of line>`, `body: ""`.
  3. On success, replace the `/task ...` token in the composer with `@TASK-<id>`.
  4. Toast `Task <id> created \u2022 Open board \u2197`.
- Advanced form: `/task <title> --p critical --type bug --tag foo` accepted via a tiny flag parser (title runs to first flag).

## Acceptance

- Typing `/task refactor renderer` in the composer creates a task and inserts a live mention chip.
- Works only when the thread has a project bound; otherwise disabled with explanation.
- Priority/type/tag flags parsed correctly.
- Unit test for the flag parser.
