---
# dinocode-q03l
title: Task ID generator utility (NanoID with prefix)
status: todo
type: feature
priority: high
tags:
    - utilities
    - phase-1
created_at: 2026-04-22T07:31:58Z
updated_at: 2026-04-22T07:31:58Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-8izj
---

Implement a shared, deterministic-looking Task ID generator that produces IDs matching the beans convention (e.g. `dnc-0ajg`). Lives in `packages/shared/taskId/` so both the server, the CLI, and tests can use the same code path.

## Subtasks

### Module setup
- [ ] Create `packages/shared/src/taskId/` directory
- [ ] Add subpath export `"./taskId": "./src/taskId/index.ts"` in `packages/shared/package.json` (no barrel index)
- [ ] Export: `generateTaskId(prefix, idLength): TaskId`, `parseTaskIdFromFilename(filename): { id, slug } | null`, `formatTaskFilename(id, slug): string`

### Generator
- [ ] Use `nanoid/non-secure` with a **lowercase alphanumeric** alphabet (avoid ambiguous chars: no `0`/`O`, no `1`/`l`/`i`) — align with beans behavior
- [ ] Respect `prefix` and `id_length` from `.dinocode/config.yml`; default prefix `dnc-`, default `id_length: 4`
- [ ] Validate that `prefix` matches `/^[a-z][a-z0-9-]*-$/` and `id_length` is between 3 and 16
- [ ] Collision handling: caller supplies an `isUnique(id) => boolean` predicate; generator retries up to 50 times, then throws `TaskIdCollisionExhaustedError`

### Filename round-trip
- [ ] `formatTaskFilename({ id: "dnc-0ajg", slug: "add-oauth" })` → `"dnc-0ajg--add-oauth.md"`
- [ ] `parseTaskIdFromFilename("dnc-0ajg--add-oauth.md")` → `{ id, slug }`
- [ ] Handle slug containing `--` (first `--` splits id from slug; rest belongs to slug)
- [ ] Return null for malformed filenames (no crash)

### Tests
- [ ] 1000-iteration collision test: no duplicates with `id_length: 4`
- [ ] Round-trip: `generate → format → parse → deep-equal`
- [ ] Regression: matches exact format beans uses (check against a sample `.beans/*.md` from this repo)
