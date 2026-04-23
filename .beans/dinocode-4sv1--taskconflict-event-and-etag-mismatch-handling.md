---
# dinocode-4sv1
title: task.conflict event and ETag mismatch handling
status: todo
type: feature
priority: high
tags:
  - phase-1
  - conflict
created_at: 2026-04-22T07:32:12Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-x8dw
blocked_by:
  - dinocode-8tuq
  - dinocode-j5i8
---

When a watcher-initiated `task.update` command carries an ETag that does not match the read-model ETag, the decider must emit a `task.conflict` event instead of `task.updated`. The event captures the server-known version and the incoming version so the client can render a three-way merge view. The FileStoreReactor must NOT re-write the file after a conflict event (otherwise it clobbers whichever party wrote last).

## Subtasks

### Contracts

- [ ] Add `task.conflict` to `OrchestrationEventType` literal union in `packages/contracts/src/orchestration.ts`
- [ ] Define `TaskConflictPayload` schema: `taskId`, `serverEtag`, `serverBody`, `incomingEtag`, `incomingBody`, `conflictingFields[]`, `detectedAt`
- [ ] Add branded `TaskEtag` schema (16-char lowercase hex for FNV-1a 64-bit)

### Decider

- [ ] In `decider.ts` `task.update` branch, compare `expectedEtag` to current read-model etag
- [ ] If mismatch: emit `task.conflict` event (not `task.updated`)
- [ ] Invariant helper: `requireTaskEtagMatch(readModel, taskId, expectedEtag)` → returns mismatch info or ok
- [ ] Unit tests: `decider.test.ts` — etag-match → updated, etag-mismatch → conflict, missing-etag on external-origin command → conflict by default

### Projector

- [ ] On `task.conflict`: set `task.conflict = { serverEtag, incomingEtag, ... }` in read-model and in `projection_tasks.conflict_json` column
- [ ] Add migration to add `conflict_json TEXT NULL` column to `projection_tasks`
- [ ] A subsequent successful `task.updated` clears the conflict

### Reactor

- [ ] FileStoreReactor: on `task.conflict`, do NOT overwrite the file (leave the watcher-originated content in place)
- [ ] Emit an observability log line with both etags and the file path

### Watcher

- [ ] Watcher must always attach the on-disk ETag to its dispatched `task.update` commands
- [ ] If projection_tasks has no row for the taskId (file created externally), treat it as `task.create` with the parsed content

### Tests

- [ ] Integration: simulate concurrent edit (agent writes file + UI dispatches update) → one conflict event emitted
- [ ] UI reducer applies conflict → task detail panel shows conflict indicator

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
