---
# dinocode-e5he
title: Implement dinocode task CLI subcommands
status: todo
type: feature
priority: normal
created_at: 2026-04-22T07:15:13Z
updated_at: 2026-04-22T07:15:23Z
parent: dinocode-lhp0
---

Implement all 8 dinocode task subcommands: list, view, create, update, delete, archive, link, unlink. Read/write .dinocode/tasks/\*.md directly. Support --json output flag.

## Subtasks

- [ ] `dinocode task list [--status] [--type] [--json]` — reads all `.dinocode/tasks/*.md`, filters, prints table or JSON
- [ ] `dinocode task view <id> [--json]` — finds file by ID prefix in filename, prints full task
- [ ] `dinocode task create --title "..." [--status] [--type] [--priority] [--parent] [--body] [--json]` — generates NanoID, writes new file
- [ ] `dinocode task update <id> [--title] [--status] [--priority] [--body] [--append-body] [--json]` — reads file, applies patch, writes back (atomic)
- [ ] `dinocode task delete <id> [--force]` — prompts confirmation unless `--force`, deletes file
- [ ] `dinocode task archive <id>` — moves file to `tasks/archive/`
- [ ] `dinocode task link <from-id> <to-id>` — adds `from-id` to `to-id.blocked_by` and `to-id` to `from-id.blocking`
- [ ] `dinocode task unlink <from-id> <to-id>` — removes the relationship
- [ ] All write commands: use atomic temp-file-rename pattern to avoid partial writes
- [ ] All commands: exit code 0 on success, non-zero on error; print error message to stderr
- [ ] `--json` flag: output structured JSON matching the `Task` contract type
- [ ] Discover workspace root by walking up from CWD looking for `.dinocode/config.yml`
