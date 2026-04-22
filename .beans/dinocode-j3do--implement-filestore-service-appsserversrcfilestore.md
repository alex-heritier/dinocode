---
# dinocode-j3do
title: Implement FileStore service (apps/server/src/fileStore/)
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:12:43Z
updated_at: 2026-04-22T07:16:01Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-8izj
---

Core file-first service: Effect.Tag interface, config loader, task parser (YAML+MD), task writer (atomic), FNV-1a ETag, loadProject, watchProject stream, watcher ignore mechanism.

## Subtasks

### Setup
- [ ] Create `apps/server/src/fileStore/` directory
- [ ] Create `FileStore.ts` — service interface + `Effect.Tag`
- [ ] Create `FileStoreLive.ts` — `Layer.effect` implementation
- [ ] Create `fileStore.test.ts` — test harness using temp dirs

### Config
- [ ] Implement `loadConfig(workspaceRoot)`: read `.dinocode/config.yml`, parse with YAML library, return `ProjectConfig` with defaults applied
- [ ] Handle missing config file gracefully (return all defaults)
- [ ] Validate prefix format (letters, numbers, hyphens, ends with `-`)

### ETag
- [ ] Implement FNV-1a 64-bit hash in `etag.ts`
- [ ] Implement deterministic YAML front matter serializer: fields in alphabetical order, arrays as flow style `[a, b]`, empty optional fields omitted, LF line endings
- [ ] Unit test: same Task object always produces same ETag across runs
- [ ] Unit test: mutating any field changes the ETag

### Task Parser
- [ ] Implement `parseTaskFile(filePath, content)` in `parser.ts`
- [ ] Extract `id` from YAML comment `# dnc-xxxx` (first line of front matter)
- [ ] Extract `slug` from filename (part after `--`, strip `.md`)
- [ ] Parse all front matter fields with effect/Schema decode
- [ ] Parse body as Markdown string after closing `---`
- [ ] Return `ParseError` with file path if schema decode fails
- [ ] Unit test: round-trip parse → write → parse produces identical Task

### Task Writer
- [ ] Implement `writeTask(task, expectedEtag?)` in `writer.ts`
- [ ] Serialize front matter fields in alphabetical order
- [ ] Write `id` as YAML comment on first line: `# dnc-xxxx`
- [ ] Write atomically: write to `<filename>.tmp`, then `fs.rename` to final path
- [ ] Before write: add path to `ignoredPaths` Set
- [ ] After write completes: remove path from `ignoredPaths` Set (use `Effect.ensuring`)
- [ ] If `expectedEtag` provided: read current file, compute ETag, compare before writing; return `ETagMismatch` error if different

### loadProject
- [ ] Implement `loadProject(workspaceRoot)`: `Effect.Effect<TaskIndex, FileStoreError>`
- [ ] Glob `tasks/*.md` and `tasks/archive/*.md`
- [ ] Parse each file; skip unparseable files with warning log (don't crash)
- [ ] Build `TaskIndex` with tasks array + etags map + config
- [ ] Create `.dinocode/tasks/` and `.dinocode/tasks/archive/` if not present

### watchProject
- [ ] Implement `watchProject(workspaceRoot)`: `Stream.Stream<FileChangeEvent, FileStoreError>`
- [ ] Use `node:fs` `watch` API with `recursive: true`
- [ ] Filter to only `.md` files in `tasks/` and `tasks/archive/`
- [ ] **Ignore** paths currently in `ignoredPaths` Set before emitting events
- [ ] Debounce rapid consecutive events for same path (50ms window)
- [ ] Emit `FileChangeEvent` with `{ type: 'modified' | 'deleted' | 'moved', path, taskId? }`
- [ ] Handle `ENOENT` (file deleted between watch event and read) gracefully

### Tests
- [ ] Parser round-trip test (parse → write → re-parse → deep equal)
- [ ] ETag stability test
- [ ] Watcher ignore test: write via `writeTask` should NOT emit a watch event
- [ ] Concurrent write test: ETag mismatch returns error, not corrupt file
