---
# dinocode-r354
title: "Expand CLI: link, unlink, archive, unarchive subcommands with full subtask list"
status: todo
type: task
priority: normal
tags:
  - phase-4
  - cli
created_at: 2026-04-22T07:37:12Z
updated_at: 2026-04-22T07:37:12Z
parent: dinocode-lhp0
blocked_by:
  - dinocode-e5he
---

The parent task dinocode-e5he lists all eight CLI subcommands in one checklist. Break out the relationship/archive commands into a dedicated ticket with more thorough subtasks since they touch multiple files and have ETag interactions.

## Subtasks

### link / unlink

- [ ] `dinocode task link <from-id> <to-id>` — reads both files, appends `from-id` to `to-id.blocked_by`, appends `to-id` to `from-id.blocking`
- [ ] Atomic multi-file update: stage both changes in memory, write to temp files, rename both; on any failure, rename back
- [ ] Refuses to create cycles — walks the `blocking` graph BFS, refuses if `to-id` reaches `from-id`
- [ ] Idempotent: linking already-linked is a no-op, exits 0 with "already linked"
- [ ] `dinocode task unlink <from-id> <to-id>` — removes both sides of the relationship
- [ ] `--force` bypasses cycle check for advanced users
- [ ] `--json` returns updated IDs and their new dependency arrays

### archive / unarchive

- [ ] `dinocode task archive <id>` — moves file from `tasks/` → `tasks/archive/`, updates `updated_at`
- [ ] Preserves id and slug (filename unchanged, path changes)
- [ ] `dinocode task unarchive <id>` — reverse
- [ ] If destination exists, exits 1 with clear error
- [ ] `--force` overwrites destination

### Tests

- [ ] Round-trip link → unlink → deep-equal pre-state
- [ ] Cycle: A blocks B, B blocks A attempt → refused unless --force
- [ ] Archive + unarchive restores original file byte-for-byte
