---
# dinocode-e7qu
title: Soil projector
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:29:12Z
updated_at: 2026-04-22T14:45:33Z
parent: dinocode-0syf
blocked_by:
  - dinocode-5ley
---

Task event projector that maintains the current state of tasks from an event stream. Used by both server read-model and CLI list/show commands. Pure logic.

## Summary of Changes

Implemented task event projector in packages/soil/src/projector.ts. Maintains current state of tasks from an event stream. Handles task.created, task.updated, task.deleted, task.archived, task.unarchived events.
