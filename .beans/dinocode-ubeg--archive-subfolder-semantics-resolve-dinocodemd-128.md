---
# dinocode-ubeg
title: Archive subfolder semantics (resolve DINOCODE.md §12.8)
status: completed
type: task
priority: normal
tags:
  - contracts
created_at: 2026-04-22T07:41:46Z
updated_at: 2026-04-23T03:09:43Z
parent: dinocode-xd5m
---

Commit to the tentative decision: archived tasks move to `.dinocode/tasks/archive/`; the watcher treats folder moves as implicit archive/unarchive. Implement and test across platforms.

## Subtasks

- [ ] FileStoreReactor: on `task.archive`, atomic rename to `archive/<id>--<slug>.md`
- [ ] On `task.unarchive`, atomic rename back to `tasks/<id>--<slug>.md`
- [ ] Watcher: on rename into `archive/`, emit `FileChangeEvent { kind: "moved-to-archive" }` and dispatch `task.archive`
- [ ] Watcher: on rename out of `archive/`, dispatch `task.unarchive`
- [ ] Cross-platform: inotify vs FSEvents vs ReadDirectoryChangesW — normalize to the same event shape
- [ ] Manual-edit scenario: user drags file in their editor from tasks/ to archive/ — system adapts seamlessly
- [ ] Tests across all 3 OSes in CI matrix

## Resolution

Implemented by `packages/soil/src/reactor.ts` (`task.archived` / `task.unarchived` cases) and `packages/soil/src/watcher.ts` (`FileChangeEvent.archived` derived from on-disk path). DINOCODE.md §12.8 promoted from Open to Resolved in this commit.

- Reactor: atomic rename into/out of `<tasksPath>/archive/` on archive/unarchive events. Write locks tracked for both source and destination so the watcher does not loop.
- Watcher: emits `archived: boolean` on every `FileChangeEvent`, so consumers can treat manual drags the same as server-initiated events.
- `findTaskFile` scans both `tasksDir` and `archiveDir`, so lookups by id work regardless of archive state.
