---
# dinocode-jy8j
title: Task conflict resolution UI (three-way merge)
status: todo
type: feature
priority: high
tags:
  - phase-2
  - conflict
created_at: 2026-04-22T07:34:13Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-4sv1
---

When a task has an active `conflict` marker (from `task.conflict` event), present a three-way merge view letting the user choose per-field: keep mine, keep theirs, or edit manually.

## Subtasks

### Surface

- [ ] Card badge: small red "!" pill when `task.conflict != null`
- [ ] Click badge → open `TaskConflictDialog` (modal, not the slide-in detail panel)
- [ ] Lock the card (cannot be dragged) while conflict is unresolved

### Dialog

- [ ] Component `apps/web/src/components/board/TaskConflictDialog.tsx`
- [ ] Three columns: `Server` | `Merged (editable)` | `Incoming`
- [ ] Per-field highlight: show only fields that differ
- [ ] Body diff: side-by-side Monaco-style diff, or unified diff with `diff-match-patch`
- [ ] Buttons per field: "← use server", "use incoming →", "edit merged"
- [ ] Global actions: "Accept all mine", "Accept all theirs", "Save merged"

### Submission

- [ ] Save dispatches `task.update` with the merged content and the **latest known server ETag** so the resolution is atomic
- [ ] On success, `task.updated` event clears the conflict marker in projection (handled in projector)

### Edge cases

- [ ] If another conflict arrives while dialog is open → show warning banner, offer to refresh diff
- [ ] If file deleted on disk while conflict pending → dialog closes, toast "Task was deleted externally"

### Tests

- [ ] E2E: simulate concurrent edit → dialog appears → user picks incoming → dispatch succeeds → conflict cleared

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
