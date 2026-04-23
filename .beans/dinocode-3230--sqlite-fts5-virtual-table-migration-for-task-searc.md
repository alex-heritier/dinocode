---
# dinocode-3230
title: SQLite FTS5 virtual table migration for task search
status: todo
type: task
priority: normal
tags:
  - infrastructure
  - phase-6
created_at: 2026-04-22T09:56:06Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-xd5m
---

Add a SQLite FTS5 virtual table `projection_tasks_fts` to the projector migrations. Prerequisite for full-text search across tasks (used by dinocode_search_tasks tool and the advanced search UI).

## Subtasks

- [ ] Add migration file: `apps/server/src/migrations/003_fts5_tasks.sql` (or next available index)
- [ ] CREATE VIRTUAL TABLE `projection_tasks_fts` USING fts5(title, body, content='projection_tasks', content_rowid='rowid')
- [ ] Add triggers: AFTER INSERT, AFTER UPDATE, AFTER DELETE on `projection_tasks` to keep FTS index in sync
- [ ] Register migration in the migration runner (`apps/server/src/db/migrations.ts` or equivalent)
- [ ] Verify FTS5 is available in the bundled SQLite (check better-sqlite3/bun:sqlite capabilities)
- [ ] Add a test: insert task, FTS query returns it; update title, new title is searchable; delete, no longer found
- [ ] Run `bun typecheck` — no new errors

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
