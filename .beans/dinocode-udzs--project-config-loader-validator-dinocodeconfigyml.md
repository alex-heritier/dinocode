---
# dinocode-udzs
title: Project config loader + validator (.dinocode/config.yml)
status: scrapped
type: feature
priority: high
tags:
    - phase-1
    - config
created_at: 2026-04-22T07:32:30Z
updated_at: 2026-04-22T12:49:22Z
parent: dinocode-x8dw
blocked_by:
    - dinocode-8izj
---

Dedicated, well-tested config loader for `.dinocode/config.yml`. Produces a fully-typed `ProjectConfig` with defaults applied, reports precise schema errors for malformed files, and is the single source of truth consumed by FileStore, watcher, CLI, and UI.

## Subtasks

### Schema
- [ ] Add `ProjectConfig` schema in `packages/contracts/src/dinocode.ts` (new file; explicit subpath export)
- [ ] Fields: `project.name`, `tasks.path`, `tasks.prefix`, `tasks.id_length`, `tasks.default_status`, `tasks.default_type`
- [ ] Strict defaults per DINOCODE.md §3.4 applied via `Schema.withDecodingDefault`
- [ ] Validate `prefix` matches `/^[a-z][a-z0-9-]*-$/`
- [ ] Validate `id_length` within `[3, 16]`
- [ ] Validate `tasks.path` is a relative, safe POSIX path (no `..`, no absolute)

### Loader
- [ ] `loadProjectConfig(workspaceRoot): Effect<ProjectConfig, ConfigError>` in `apps/server/src/fileStore/config.ts`
- [ ] Use `yaml` parser (already a transitive dep? verify and pin if not)
- [ ] Missing file → return defaults (no error)
- [ ] Invalid YAML → `ConfigParseError` with line/col from parser
- [ ] Schema mismatch → `ConfigValidationError` with human-readable path (e.g. `tasks.prefix: must end with '-'`)

### Writer
- [ ] `writeProjectConfig(workspaceRoot, config)` atomic write
- [ ] Preserve key order matching the default template
- [ ] Preserve user comments when possible (use round-trip YAML if feasible; otherwise document that comments are dropped)

### RPC
- [ ] Add `dinocode.getConfig({ projectId })` read RPC
- [ ] Add `dinocode.updateConfig({ projectId, patch })` write RPC
- [ ] Add to `WS_METHODS` constants and `WsRpcGroup`

### Tests
- [ ] Missing file → defaults
- [ ] Every invalid prefix variant → `ConfigValidationError` with clear message
- [ ] Round-trip: write then re-load → deep-equal
- [ ] Custom prefix `team-` and `id_length: 6` work end-to-end

## Reasons for Scrapping

Superseded by `dinocode-e0e8` (`Soil config and project loader`). Project config parsing is now part of the Soil package, and server/CLI consumers should reuse that implementation instead of maintaining a separate server-local loader plan.
