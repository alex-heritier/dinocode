---
# dinocode-kmza
title: Implement subtask completion prompt
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:35Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-b6x6
blocked_by:
  - dinocode-5kre
---

When all children of a parent task reach `completed`, surface a prompt offering to complete the parent as well. Opt-in: one click to accept, dismissible.

## Subtasks

### Server-side detection

- [ ] After projector handles `task.updated` with `status: completed`, check whether this task has a `parent`
- [ ] If parent exists, count its children; if ALL children are now `completed` (or `scrapped`), emit synthetic `task.parent-children-completed` event (internal, not user-visible in activity)
- [ ] Implemented in a new reactor `SubtaskCompletionReactor` in `apps/server/src/orchestration/Layers/`
- [ ] Register in `OrchestrationReactor.ts` startup

### Event contract

- [ ] Add `task.parent-children-completed` to `OrchestrationEventType` union; payload `{ parentTaskId, childTaskIds[] }`
- [ ] Projector does NOT mutate the parent status (user must explicitly accept); instead sets `task.pendingAutoComplete = true` flag in read model

### UI

- [ ] Toast in the board: "All subtasks of 'Parent title' are complete. Mark parent as complete?"
- [ ] Buttons: "Complete" (dispatches `task.update` to `completed`), "Dismiss" (sets `suppressedAutoComplete` on parent), "Open task" (opens detail panel)
- [ ] Multiple pending prompts coalesce into a single stacked toast

### Cleanup

- [ ] When ANY child reverts to non-completed, clear the parent's `pendingAutoComplete`
- [ ] Suppression is per-user-session (stored in desktopSettings)

### Tests

- [ ] Fixture: parent + 3 children, complete all → toast appears once
- [ ] Revert one child → toast clears
- [ ] Scrapped children count as complete

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
