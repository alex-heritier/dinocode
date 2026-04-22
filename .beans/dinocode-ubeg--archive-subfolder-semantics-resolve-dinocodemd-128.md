---
# dinocode-ubeg
title: Archive subfolder semantics (resolve DINOCODE.md §12.8)
status: todo
type: task
priority: normal
tags:
  - contracts
created_at: 2026-04-22T07:41:46Z
updated_at: 2026-04-22T07:41:46Z
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
