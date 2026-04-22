---
# dinocode-y758
title: Add projection_tasks SQLite migration
status: todo
type: task
priority: high
created_at: 2026-04-22T07:12:03Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-8izj
---

Create migration file for projection_tasks table. Register in Migrations.ts. Columns: id, slug, title, status, type, priority, order, parent_id, tags_json, blocking_json, blocked_by_json, body, created_at, updated_at, etag.

## Subtasks

- [ ] Determine next migration number by reading `apps/server/src/persistence/Migrations/`
- [ ] Create `NNN_AddProjectionTasks.ts` with `CREATE TABLE IF NOT EXISTS projection_tasks`
- [ ] Columns: `id TEXT PRIMARY KEY, slug TEXT, title TEXT NOT NULL, status TEXT NOT NULL, type TEXT NOT NULL, priority TEXT, ord TEXT, parent_id TEXT, tags TEXT, blocking TEXT, blocked_by TEXT, body TEXT, created_at TEXT, updated_at TEXT, etag TEXT`
- [ ] Add index on `status` column for fast board projection queries
- [ ] Add index on `parent_id` for subtask lookups
- [ ] Static-import the migration in `Migrations.ts` and add to the migrations array
- [ ] Verify migration runs cleanly by starting dev server and checking SQLite schema
