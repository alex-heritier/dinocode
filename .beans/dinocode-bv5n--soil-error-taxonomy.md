---
# dinocode-bv5n
title: Soil error taxonomy
status: completed
type: task
priority: normal
created_at: 2026-04-22T08:29:25Z
updated_at: 2026-04-22T14:45:21Z
parent: dinocode-0syf
blocked_by:
  - dinocode-e2wm
---

Define user-facing error types for soil: TaskNotFound, TaskAlreadyExists, InvalidFrontMatter, ETagMismatch, ProjectNotFound, etc. Used by server and CLI.

## Summary of Changes

Defined soil error taxonomy in packages/soil/src/errors.ts: TaskNotFound, TaskAlreadyExists, InvalidFrontMatter, ETagMismatch, ProjectNotFound as tagged error classes.
