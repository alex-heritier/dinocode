---
# dinocode-fj6n
title: "Migration: move repo's own planning from .beans/ to .dinocode/tasks/"
status: todo
type: task
priority: normal
tags:
  - migration
created_at: 2026-04-22T07:40:38Z
updated_at: 2026-04-22T07:40:38Z
parent: dinocode-xd5m
---

This very repo currently tracks its Dinocode plan under `.beans/` using a beans CLI. Once the Dinocode file store and CLI ship, migrate the repo's planning to `.dinocode/tasks/` to dogfood the product.

## Subtasks

- [ ] One-off migration script `scripts/migrate-beans-to-dinocode.ts`
- [ ] Read `.beans/*.md` (identical YAML+MD format) and copy to `.dinocode/tasks/` translating prefix `dinocode-` → `dnc-` (or keep `dinocode-` per config)
- [ ] Update `.beans.yml` → `.dinocode/config.yml` with equivalent settings
- [ ] Git commit: `chore: migrate planning from beans to dinocode`
- [ ] Delete `.beans/` and `.beans.yml` in follow-up commit
- [ ] Add a one-liner to README.md confirming the project uses its own kanban now
