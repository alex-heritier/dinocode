---
# dinocode-732i
title: Thread \u2194 task binding + ChatHeader task chip
status: todo
type: task
priority: high
created_at: 2026-04-23T04:39:47Z
updated_at: 2026-04-23T04:39:47Z
parent: dinocode-qsqf
---

Persist an optional `taskId` on threads and surface it in the chat UI; surface bound threads on the task's detail sheet.

## Data model

- New Dinocode-side mapping `thread_task_bindings(thread_id, task_id, created_at)` in the dinocode-server SQLite (NOT t3code's thread table). Keeps t3code's schema untouched per `docs/dinocode-packages.md`.
- WS method `orchestration.bindThreadToTask({ threadId, taskId })` + `getBindingsForTask(taskId)` + `getBindingForThread(threadId)`.

## Chat side

- `ChatHeader` grows a small pinned chip to the left of the thread title when a binding exists:
  `[TASK dinocode-fm1h \u2197]`. Click \u2192 opens detail sheet.
- Sidebar thread rows get a subtle dot prefix when bound.

## Board side

- Task Detail slide-over `Threads (N)` section lists bound threads with timestamps (dinocode-xjal consumes this).

## Auto-binding

- `startTaskSession` (dinocode-skse) writes a binding on thread creation.
- Composer `/task` and `@TASK-` insertions DO NOT auto-bind (they're references, not the thread's "subject"). Users can explicitly "Pin this task to this thread" from the chip menu.

## Acceptance

- Binding created on Start Session.
- Task chip appears in chat header; click opens detail sheet.
- Board detail sheet lists bound threads.
- Binding survives reload; deleting the task cascades to remove bindings.
