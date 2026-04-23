---
# dinocode-cqwo
title: Add 'Start Session' action to KanbanCard
status: todo
type: task
priority: high
created_at: 2026-04-22T07:14:50Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-0apu
blocked_by:
  - dinocode-o0oh
---

The "Start Session" button on a kanban card (and in the TaskDetailPanel) creates a new thread with this task's context pre-loaded.

## Subtasks

### UI placement

- [ ] Primary "Start Session" button in `TaskDetailPanel` footer
- [ ] Secondary, icon-only "▶" button on card hover
- [ ] Disabled (with tooltip) when `blocked_by` contains any non-completed/non-scrapped task
- [ ] Disabled tooltip names the specific blockers: "Blocked by: dnc-abc1 Foo, dnc-xyz9 Bar"

### Flow

- [ ] Click → open thread bootstrap modal (reuse existing thread creation form)
- [ ] Modal pre-fills title with task title (user can edit)
- [ ] Modal shows "Task context: {taskId} {title}" pill (removable)
- [ ] Model selection defaults to project's default; user can override
- [ ] Submit dispatches `thread.turn.start` with bootstrap + `taskIds: [taskId]`

### Post-create

- [ ] Navigate to the new thread (`/env/.../thread/...`) on success
- [ ] Show a small banner in the thread "Started from task dnc-abc1" with a chip-link back to the task
- [ ] If the task status is `todo`, dispatch a follow-up `task.update` to move it to `in-progress` (configurable; behind a toggle "Auto-move to In Progress on session start", default on)

### Tests

- [ ] Disabled state: mock blocked task, button disabled, tooltip correct
- [ ] Happy path: modal → submit → navigation happens → context chip visible in thread

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
