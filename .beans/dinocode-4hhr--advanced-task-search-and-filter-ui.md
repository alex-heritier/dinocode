---
# dinocode-4hhr
title: Advanced task search and filter UI
status: todo
type: feature
priority: low
created_at: 2026-04-22T07:15:45Z
updated_at: 2026-04-22T09:56:16Z
parent: dinocode-0ub1
blocked_by:
  - dinocode-3230
---

Board-wide search and advanced filtering, beyond the basic filter bar. Delivers a fast search-first UX with fuzzy matching, scoped queries (e.g. `status:todo tag:auth`), and saved searches.

## Subtasks

### Backend

- [ ] Add SQLite FTS5 virtual table `projection_tasks_fts(title, body)` in a new migration
- [ ] Keep FTS index in sync via projector triggers (or post-projection hooks)
- [ ] RPC `orchestration.searchTasks({ projectId, query, limit, cursor? })` returning `{matches, nextCursor}`

### Query syntax

- [ ] Parser: `status:todo tag:auth priority:high "literal phrase"`
- [ ] Unquoted words → full-text OR match against title+body; scoped prefixes filter; `-foo` negation
- [ ] Fuzzy prefix match on task ID (`dnc-0aj` matches `dnc-0ajg`)

### UI

- [ ] Cmd/Ctrl+K opens global search sheet (not just the board filter field)
- [ ] Results grouped: "Tasks", "Threads", "Files" (extensible)
- [ ] Arrow + Enter navigation; each result shows source context
- [ ] Saved searches pinned in filter bar dropdown

### Performance

- [ ] Debounce 150ms; cancel in-flight on new keystroke
- [ ] Return first page < 30ms for 10k-task projects

### Tests

- [ ] Each scoped prefix
- [ ] Fuzzy ID match
- [ ] Empty query returns recent/top tasks
