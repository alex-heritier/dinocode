---
# dinocode-9mrx
title: Auto-initialize .dinocode/ on first open
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:13:15Z
updated_at: 2026-04-22T07:31:41Z
parent: dinocode-x8dw
---

On server startup (and when a user registers a new project), detect whether `.dinocode/config.yml` exists at the workspace root. If missing, scaffold the directory structure, default config, and `.gitignore`. Emit a `project.dinocodeInitialized` orchestration event so clients can refresh their read model.

## Subtasks

### Detection

- [ ] Add `detectDinocodeState(workspaceRoot): "initialized" | "missing"` helper in `apps/server/src/fileStore/init.ts`
- [ ] On every `ProjectCreated` event (and at server startup for registered projects), run the detector
- [ ] Surface state on `OrchestrationProjectShell` as `dinocodeInitialized: boolean`

### Scaffolding

- [ ] Create directory tree: `.dinocode/`, `.dinocode/tasks/`, `.dinocode/tasks/archive/`, `.dinocode/plans/`
- [ ] Create `.dinocode/.conversations/` and `.dinocode/.sessions/` (runtime dirs)
- [ ] Write default `.dinocode/config.yml` mirroring the spec §3.4 (project name inferred from workspace folder name)
- [ ] Write `.dinocode/.gitignore` excluding `.conversations/`, `.sessions/`
- [ ] Write atomically (temp file + rename) so a crash mid-init never leaves a half-written config

### Event / RPC

- [ ] Add new command `project.dinocode.initialize` (contract + decider handler)
- [ ] Add new event `project.dinocode-initialized` (payload: `projectId`, `createdPaths[]`, `initializedAt`)
- [ ] Projector flips `dinocodeInitialized` on the project read-model row
- [ ] FileStoreReactor adds all created paths to its `ignoredPaths` set for the debounce window so the watcher doesn't re-ingest them

### Tests

- [ ] Unit test: fresh workspace → detector reports `missing`
- [ ] Unit test: after init → all directories + files exist with correct permissions
- [ ] Integration test: dispatch `project.dinocode.initialize` → event emitted → files on disk → projection updated
- [ ] Idempotency test: running initialize twice is a no-op (does not overwrite existing config)
