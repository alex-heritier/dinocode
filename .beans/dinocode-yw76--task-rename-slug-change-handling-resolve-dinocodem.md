---
# dinocode-yw76
title: Task rename / slug change handling (resolve DINOCODE.md §12.7)
status: todo
type: feature
priority: normal
tags:
  - contracts
created_at: 2026-04-22T07:41:25Z
updated_at: 2026-04-22T07:41:25Z
parent: dinocode-xd5m
---

Close the open question: task IDs are immutable but the filename slug can change. Implementation must update the filename without losing event history.

## Subtasks

- [ ] Decide: allow `title` updates to auto-propose a slug update? (Decision: yes, but user-confirmed — not automatic on every title tweak)
- [ ] Add `task.rename-slug` command + event: `{ taskId, oldSlug, newSlug }`
- [ ] Decider: ensures new slug is URL-safe, unique within project
- [ ] FileStoreReactor on `task.slug-renamed`: delete old file, write new file with same body, atomic via tmp file
- [ ] Watcher: detects a rename (inotify emits `deleted` + `created` for same inode on many platforms) and suppresses spurious `task.delete` followed by `task.create`
- [ ] Rename strategy: use `renameat2` on Linux, `fs.rename` elsewhere; platform helper in shared
- [ ] Thread references to the task remain valid (ID is stable)
- [ ] UI: "Rename file" button in detail panel → prompts for new slug, previews new filename, confirms
- [ ] Tests: rename mid-turn shouldn't break active thread's context chips
