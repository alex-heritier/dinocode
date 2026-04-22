---
# dinocode-vdno
title: Task context chips in thread UI
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:14:50Z
updated_at: 2026-04-22T09:55:27Z
parent: dinocode-0apu
blocked_by:
    - dinocode-56yo
---

Display referenced task IDs as chips in the thread composer header. Allow adding tasks via `@mention` autocomplete, removing via chip close button, and persisting chips as the thread's current context set.

## Subtasks

### Store
- [ ] Add `threadContextTasks: Map<ThreadId, TaskId[]>` slice to `EnvironmentState`
- [ ] Persist last-used context to `localStorage` keyed by threadId

### Chip rendering
- [ ] Chip component above the composer input: `[dnc-0ajg] Add OAuth flow ×`
- [ ] Chip color matches task status (e.g. blue for in-progress)
- [ ] Click chip → opens task detail in a right-side sheet (or navigates to board with card selected, user preference)
- [ ] × removes chip from next turn's `taskIds`

### Autocomplete
- [ ] Trigger `@` in composer → dropdown of tasks matching query
- [ ] Query matches `id` (fuzzy) + `title` + `tags`
- [ ] Arrow keys navigate; Enter selects; Esc closes
- [ ] Selecting adds a chip AND inserts `@dnc-0ajg` token into the message body (so the text persists in history)
- [ ] Reuses existing mention infrastructure in `composer-editor-mentions.ts`

### Dispatch
- [ ] On `thread.turn.start`, include `taskIds` derived from chips (not parsed from body)
- [ ] Chips persist across turns in the same thread (user can clear manually)

### Tests
- [ ] Mention picker appears on `@`, filters correctly
- [ ] Chip click opens detail; × removes
- [ ] Refresh preserves chips via localStorage
