---
# dinocode-j0z9
title: "Agent tool: dinocode_search_tasks (full-text)"
status: todo
type: task
priority: low
tags:
  - phase-4
  - tools
created_at: 2026-04-22T07:37:30Z
updated_at: 2026-04-22T09:56:16Z
parent: dinocode-lhp0
blocked_by:
  - dinocode-ndam
  - dinocode-3230
---

Discoverability tool for agents: full-text search across tasks without dumping the whole list.

## Subtasks

- [ ] Add `dinocode_search_tasks(query, limit?)` tool to shared definitions
- [ ] Backed by the SQLite FTS5 index on `projection_tasks(title, body)` (add FTS5 virtual table migration if absent)
- [ ] Returns up to `limit` tasks (default 10), each with: `id`, `title`, `status`, match snippet (±40 chars around hit)
- [ ] Auto-register in Codex + Claude adapters
- [ ] CLI mirror: `dinocode task list --search "..."` uses the same index
- [ ] Tests: multi-word query, phrase query, negations (`-foo`)
