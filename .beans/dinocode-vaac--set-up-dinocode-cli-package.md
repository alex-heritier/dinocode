---
# dinocode-vaac
title: Set up dinocode CLI package
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:13Z
updated_at: 2026-04-22T07:36:04Z
parent: dinocode-lhp0
---

Stand up the `dinocode` CLI as a separate package that reuses the FileStore code path (parser/writer/etag/config) via `@t3tools/shared/fileStore` subpath — no duplication with the server.

## Subtasks

### Package
- [ ] Create `apps/cli/` (Turbo workspace)
- [ ] `package.json`: `"bin": { "dinocode": "./dist/index.js" }`, build via `tsdown` (same tooling as server)
- [ ] `tsconfig.json` extends `tsconfig.base.json`
- [ ] Install into root via `bun install`; verify `bun run --filter apps/cli build` works
- [ ] Add `apps/cli` to `turbo.json` pipeline (`build`, `lint`, `typecheck`, `test`)

### Command framework
- [ ] Use `effect/unstable/cli` (same as server's `cli.ts`) for consistency
- [ ] Top-level command `dinocode` with subcommands: `init`, `task`, `config`, `doctor`
- [ ] Global flags: `--workspace <path>` (override discovery), `--json`, `--quiet`, `--verbose`

### Workspace discovery
- [ ] Walk up from `$PWD` looking for `.dinocode/config.yml`
- [ ] If not found: exit 1 with "No .dinocode found; run `dinocode init`"
- [ ] Cache discovery result within a single invocation

### Shared modules
- [ ] Create `packages/shared/src/fileStore/` with parser/writer/etag/config so CLI + server share one implementation
- [ ] CLI imports: `@t3tools/shared/fileStore`, `@t3tools/shared/taskId`, `@t3tools/shared/fractionalIndex`
- [ ] CLI does NOT talk to the running server; it writes files directly and relies on the server's watcher

### Distribution
- [ ] `npx dinocode ...` works via `npx @t3tools/cli` (no namespace conflict)
- [ ] Also install as `dinocode` binary in desktop app packaging (optional shim)
- [ ] Add install instruction to README.md

### Tests
- [ ] Spawn CLI in temp workspace, run `init` → `task create` → `task list` → verify output
