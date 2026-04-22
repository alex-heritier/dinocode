---
# dinocode-e0e8
title: Soil config and project loader
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:29:18Z
updated_at: 2026-04-22T14:45:26Z
parent: dinocode-0syf
blocked_by:
  - dinocode-e2wm
---

Load and validate .dinocode/config.yml. Walks up from a path to find the project root. Pure config parsing + discovery logic.

## Summary of Changes

Implemented config loader and project discovery in packages/soil/src/config.ts. Loads and validates .dinocode/config.yml, walks up from path to find project root, pure config parsing.
