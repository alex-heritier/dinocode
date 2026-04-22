---
# dinocode-nvy8
title: End-to-end integration test suite (Playwright + server harness)
status: todo
type: feature
priority: high
tags:
  - tests
created_at: 2026-04-22T07:40:58Z
updated_at: 2026-04-22T07:40:58Z
parent: dinocode-xd5m
---

Exhaustive end-to-end coverage of the complete Dinocode loop: RPC dispatch → decider → projector → reactor → file on disk → watcher → back into orchestration. Catches bugs that unit tests can't.

## Subtasks

### Harness

- [ ] Extend `apps/server/src/OrchestrationEngineHarness.integration.ts` with `startDinocodeHarness({ tempDir })`
- [ ] Harness spins up: server with SQLite in-memory, FileStore pointed at tempDir, mock provider adapter
- [ ] Helpers: `dispatch(cmd)`, `waitForFile(path)`, `writeFile(path, content)`, `readFile(path)`

### Scenarios

- [ ] Create task via RPC → file appears on disk with correct content + ETag
- [ ] Edit file externally → `task.updated` event emitted with matching payload
- [ ] Conflict: dispatch + external edit within same tick → exactly one `task.conflict` event
- [ ] Archive → file moves to archive/ → un-archive → file returns
- [ ] Link → both source + target files updated atomically
- [ ] Delete → file removed; projection row gone
- [ ] Bootstrap: pre-seed 50 files → startup → projection matches
- [ ] Watcher stress: 100 concurrent external writes → no dropped events, no duplicates

### Playwright UI coverage

- [ ] Board renders with seeded tasks
- [ ] Drag card across columns → file on disk updated within 200ms
- [ ] Inline create → optimistic + server-confirmed
- [ ] Cmd+click → link → edge appears
- [ ] Start session → new thread opens with task chip
- [ ] Context chip × removes from next turn

### CI

- [ ] Run on every PR; parallel shards by scenario
- [ ] Flaky-test quarantine via retry-with-report
