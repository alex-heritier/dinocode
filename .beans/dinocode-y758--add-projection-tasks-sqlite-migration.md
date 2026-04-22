---
# dinocode-y758
title: Add projection_tasks SQLite migration
status: completed
type: task
priority: high
created_at: 2026-04-22T07:12:03Z
updated_at: 2026-04-22T14:46:37Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-8izj
---

Create migration file for projection_tasks table. Register in Migrations.ts. Columns: id, slug, title, status, type, priority, order, parent_id, tags_json, blocking_json, blocked_by_json, body, created_at, updated_at, etag.

## Subtasks

- [x] Determine next migration number by reading `apps/server/src/persistence/Migrations/`
- [x] Create `026_ProjectionTasks.ts` with `CREATE TABLE IF NOT EXISTS projection_tasks`
- [x] Columns: `id TEXT PRIMARY KEY, slug TEXT, title TEXT NOT NULL, status TEXT NOT NULL, type TEXT NOT NULL, priority TEXT, ord TEXT, parent_id TEXT, tags TEXT, blocking TEXT, blocked_by TEXT, body TEXT, created_at TEXT, updated_at TEXT, etag TEXT`
- [x] Add index on `status` column for fast board projection queries
- [x] Add index on `parent_id` for subtask lookups
- [x] Static-import the migration in `Migrations.ts` and add to the migrations array
- [x] Verify migration runs cleanly (typecheck passes)

## Summary of Changes

Created apps/server/src/persistence/Migrations/026_ProjectionTasks.ts with CREATE TABLE, status index, parent_id index. Registered in Migrations.ts. Created ProjectionTasks layer and service interface.
