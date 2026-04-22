---
# dinocode-cy2j
title: Soil FileStore core
status: completed
type: feature
priority: normal
created_at: 2026-04-22T08:28:55Z
updated_at: 2026-04-22T14:45:35Z
parent: dinocode-0syf
blocked_by:
  - dinocode-e2wm
---

Parser, writer, etag calculator, and path utilities for .dinocode/tasks/ YAML files. Pure functions only. Exported via @dinocode/soil/fileStore.

## Summary of Changes

Implemented FileStore core in packages/soil: parser.ts (YAML front-matter parser), renderer.ts (Markdown task file writer), etag.ts (FNV-1a hash ETag calculator). All pure functions.
