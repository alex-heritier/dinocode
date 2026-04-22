---
# dinocode-7jwg
title: Soil decider
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:28:58Z
updated_at: 2026-04-22T14:45:31Z
parent: dinocode-0syf
blocked_by:
  - dinocode-5ley
---

Task command handler and state machine. Converts task commands (create, update, move, archive, link, unlink) into domain events. Pure logic, no file IO.

## Summary of Changes

Implemented task command handler and state machine in packages/soil/src/decider.ts. Handles create, update, delete, archive, unarchive commands, producing domain events. Pure logic, no file IO.
