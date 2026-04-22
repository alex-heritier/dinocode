---
# dinocode-8u6r
title: Soil fractional index utility
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:28:50Z
updated_at: 2026-04-22T14:45:25Z
parent: dinocode-0syf
blocked_by:
  - dinocode-e2wm
---

LexoRank-style fractional index generator for kanban ordering. Pure functions, no IO. Exported via @dinocode/soil/fractionalIndex.

## Summary of Changes

Implemented LexoRank-style fractional index generator in packages/soil/src/fractionalIndex.ts. Provides generateOrderBetween, generateOrderBefore, generateOrderAfter for kanban card ordering.
