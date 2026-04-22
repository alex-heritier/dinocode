---
# dinocode-5ley
title: Soil task schema types and validation
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:28:47Z
updated_at: 2026-04-22T14:45:20Z
parent: dinocode-0syf
blocked_by:
  - dinocode-e2wm
---

Define Task, TaskMeta, TaskStatus, TaskPriority, and front-matter Schema schemas in packages/soil. Uses effect/Schema for runtime validation.

## Summary of Changes

Defined TaskMeta, TaskStatus, TaskType, TaskPriority, and full Task schema in packages/soil/src/schema.ts using effect/Schema. Includes OrchestrationTask type for read-model projections.
