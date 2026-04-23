---
# dinocode-ndam
title: Shared dinocode tool definitions module (server + adapters)
status: todo
type: feature
priority: normal
tags:
  - phase-4
  - tools
created_at: 2026-04-22T07:36:33Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-lhp0
---

Single source of truth for the built-in tool schemas and handlers. Both Codex and Claude adapters import from this module; test coverage is centralized.

## Subtasks

### Module location

- [ ] Create `apps/server/src/dinocodeTools/definitions.ts`
- [ ] Export: `TOOL_DEFINITIONS` array with `{ name, description, inputSchema, handler }` shape
- [ ] Export: `toCodexTool(def)`, `toClaudeTool(def)`, `toCursorTool(def)` adapters (each returns provider-specific shape)

### Tools

- [ ] `dinocode_list_tasks` — filters: status, type, priority, tag, blocked, search; returns compact `{id, title, status, priority, blocked_by_count}[]`
- [ ] `dinocode_view_task` — input: `{taskId}`; returns full `Task`
- [ ] `dinocode_create_task` — dispatches `task.create`
- [ ] `dinocode_update_task` — dispatches `task.update` with ETag
- [ ] `dinocode_archive_task` — dispatches `task.archive`
- [ ] `dinocode_link_tasks` — dispatches `task.link`
- [ ] `dinocode_unlink_tasks` — dispatches `task.unlink`
- [ ] `dinocode_list_threads_for_task` — reverse lookup of thread references

### Input schemas

- [ ] Use `effect/Schema` for each input; export JSON Schema via `JSONSchema.make`
- [ ] Validate server-side on every call; reject malformed inputs with clear errors

### Result schema

- [ ] Common `DinocodeToolResult<T>` tagged: `{ok: true, data: T}` or `{ok: false, code, message, hint?}`
- [ ] Documented error codes: `NOT_FOUND`, `ETAG_MISMATCH`, `VALIDATION`, `BLOCKED`, `INTERNAL`

### Tests

- [ ] Each tool end-to-end via test harness
- [ ] Adapter conversion round-trip (definition → adapter shape → back)

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
