---
# dinocode-mdhg
title: "Data migration: schema evolution strategy for future task-schema changes"
status: todo
type: task
priority: low
tags:
  - migration
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-22T07:42:21Z
parent: dinocode-xd5m
---

Task front-matter will evolve. Define a forward/backward-compatible evolution strategy now to avoid breakage later.

## Subtasks

- [ ] Introduce `schemaVersion: number` in front-matter (default 1, optional, omitted means 1)
- [ ] Parser tolerates unknown fields (preserved byte-for-byte on rewrite)
- [ ] Writer adds `schemaVersion` only when > 1
- [ ] Migration runner: `dinocode migrate` CLI walks tasks, applies registered migrations
- [ ] Versioned migrations under `apps/cli/src/migrations/v1-to-v2.ts`, `v2-to-v3.ts`
- [ ] Dry-run mode default; write needs `--apply`
