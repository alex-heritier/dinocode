---
# dinocode-7xp4
title: 'Project registration: seed orchestration read-model from .dinocode/tasks on register'
status: todo
type: task
priority: high
tags:
    - phase-1
    - bootstrap
created_at: 2026-04-22T07:32:45Z
updated_at: 2026-04-22T07:32:45Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-j3do
    - dinocode-j5i8
---

When a project is registered (existing `project.create` flow) or on server startup for each registered project, the orchestration engine must seed its read-model and `projection_tasks` table from the current on-disk `.dinocode/tasks/*.md` files before it starts emitting task events.

## Subtasks

- [ ] Extend `ServerRuntimeStartup` to iterate registered projects after migrations run
- [ ] For each project: call `FileStore.loadProject(workspaceRoot)` → returns `TaskIndex`
- [ ] Diff `TaskIndex` vs `projection_tasks`:
  - [ ] Files on disk but not in DB → dispatch internal `task.create` (marked `origin: "bootstrap"` in metadata)
  - [ ] Rows in DB but file missing → dispatch internal `task.delete`
  - [ ] Both exist, ETag differs → dispatch internal `task.update` with the disk ETag
  - [ ] Files in `tasks/archive/` → ensure `status` is archived in DB
- [ ] All bootstrap commands are tagged `metadata.origin = "bootstrap"` so reactors know not to re-write files
- [ ] Register this bootstrap phase BEFORE starting the file watcher (prevents a thundering herd of watcher-dispatched updates)
- [ ] Integration test: seed 50 sample tasks, start server, `projection_tasks` matches disk within 2 seconds
