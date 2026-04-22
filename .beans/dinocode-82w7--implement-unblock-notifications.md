---
# dinocode-82w7
title: Implement unblock notifications
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:35Z
updated_at: 2026-04-22T07:38:27Z
parent: dinocode-b6x6
---

When a task transitions to `completed` or `scrapped`, scan all tasks whose `blocked_by` contains this task ID. If a task's last blocker is now resolved, surface an "unblocked" notification.

## Subtasks

### Server-side
- [ ] New reactor `UnblockReactor` in `apps/server/src/orchestration/Layers/`
- [ ] On `task.updated` with status transition → completed/scrapped, query projection_tasks where `blocked_by LIKE '%taskId%'`
- [ ] For each candidate, check whether ALL blockers are resolved
- [ ] If newly unblocked, emit synthetic `task.unblocked` event with payload `{ taskId, resolvedBlockers[] }`
- [ ] Projector sets `task.unblockedAt` timestamp on read model

### UI surfaces
- [ ] Kanban card shows a "Ready" pulse-ring for tasks unblocked in the last 10 minutes
- [ ] Board toast (stacked if multiple): "2 tasks are now unblocked" with "View" action linking to filtered board
- [ ] Task detail panel "Activity" tab shows `task.unblocked` event prominently
- [ ] Home agent system prompt includes a "Recently unblocked" line when relevant

### Settings
- [ ] User preference: `unblockNotifications: "toast" | "badge-only" | "off"`
- [ ] Desktop Notifications API: opt-in native notification when app is not focused

### Tests
- [ ] A blocks B, B blocks C: complete A → B unblocked event; C still blocked
- [ ] Re-opening A → B not unblocked (regression safety)
