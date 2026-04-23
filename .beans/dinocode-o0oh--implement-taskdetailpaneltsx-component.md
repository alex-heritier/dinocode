---
# dinocode-o0oh
title: Implement TaskDetailPanel.tsx component
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:14:22Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-lsa5
---

Slide-in detail panel. Tabs: Description, Subtasks, Blockers, Activity. Inline edit mode. 'Start Session' button. Subscribes to subscribeTask stream.

## Subtasks

- [ ] Slide-in panel from right: 480px wide, animated with CSS transition, dismissible by clicking backdrop or pressing Escape
- [ ] Panel header: task title (editable inline on click), ID badge, status pill, close button
- [ ] Edit controls: status dropdown, type dropdown, priority dropdown — each dispatches `task.update` on change
- [ ] Tags editor: pill input with add/remove, dispatches `task.update`
- [ ] **Description tab**: Markdown editor (textarea with preview toggle), save button dispatches `task.update`
- [ ] **Subtasks tab**: list of child tasks (query tasks where `parent == taskId`); each row links to that task's detail; `+ Add Subtask` inline creation
- [ ] **Blockers tab**: list `blocking` and `blocked_by` tasks; link to each task; `+ Add Blocker` with task ID search/autocomplete
- [ ] **Activity tab**: list of `TaskEvent` history (from `subscribeTask` stream), reverse-chronological, formatted timestamps
- [ ] 'Start Session' button: disabled if any `blocked_by` tasks are non-completed; tooltip explains why
- [ ] Subscribe to `subscribeTask({ taskId })` — update panel in real-time as events arrive
- [ ] Keep `TaskDetailPanel.tsx` <500 LOC; split tabs into separate files

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
