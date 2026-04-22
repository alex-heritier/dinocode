---
# dinocode-kky3
title: "Archive view: dedicated route for archived tasks"
status: todo
type: task
priority: normal
tags:
  - phase-2
  - archive
created_at: 2026-04-22T07:34:31Z
updated_at: 2026-04-22T09:56:16Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-y7dm
---

Completed/scrapped tasks live in the regular board columns; archived tasks (physically moved to `.dinocode/tasks/archive/`) get their own view so the main board stays lean.

## Subtasks

- [ ] New route: `_chat.board.$environmentId.$projectId.archive.tsx`
- [ ] Subscribes to a `subscribeArchivedTasks({ projectId })` RPC (add to contracts + ws.ts)
- [ ] List view (not kanban) with columns: title, status, type, archived_at, "Unarchive" action
- [ ] Search + filter bar (reuse filter bar component)
- [ ] Pagination (50 per page, cursor-based)
- [ ] "Unarchive" dispatches `task.unarchive` → file moves back to `tasks/`
- [ ] Link from board header: "Archived (N)" count → navigates to archive view
- [ ] Keyboard: `G A` → archive view
