---
# dinocode-0gos
title: Implement inline task creation form
status: todo
type: task
priority: high
created_at: 2026-04-22T07:14:22Z
updated_at: 2026-04-22T07:33:36Z
parent: dinocode-lsa5
---

Compact inline form that appears at the top of any column when the user clicks "+". Primary goal: zero-friction task creation (title-only is enough).

## Subtasks

- [ ] Component `apps/web/src/components/board/InlineTaskForm.tsx`
- [ ] Fields: `title` (required, auto-focused), `type` (dropdown, default from `config.tasks.default_type`), `priority` (dropdown, default `normal`)
- [ ] Submit on `Enter`; `Shift+Enter` keeps form open and creates another
- [ ] `Escape` cancels, restores any pending draft in local state so accidental close doesn't lose work
- [ ] Dispatches `task.create` command; derives `slug` client-side from title (kebab-case, max 60 chars) — server authoritatively regenerates if clashes
- [ ] Optimistic UI: show a "pending" card at the top of the column immediately; rollback on dispatch error
- [ ] Status of new task = the column's status (drops into the column where "+" was clicked)
- [ ] `order` = top-of-column (computed via `generateOrderBetween(null, firstCardOrder)`)
- [ ] Keyboard shortcut: pressing `N` on the board focuses the "Todo" column's inline form
- [ ] Accessibility: `role="form"`, `aria-label="Create new task"`, labelled inputs
- [ ] Tests: submit creates, Escape cancels, keeps focus in form after Shift+Enter, optimistic card appears immediately
