# AGENTS.md

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).

## Project Snapshot

T3 Code is a minimal web GUI for using coding agents like Codex and Claude.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- `apps/server`: Node.js WebSocket server. Wraps Codex app-server (JSON-RPC over stdio), serves the React web app, and manages provider sessions.
- `apps/web`: React/Vite UI. Owns session UX, conversation/event rendering, and client-side state. Connects to the server via WebSocket.
- `packages/contracts`: Shared effect/Schema schemas and TypeScript contracts for provider events, WebSocket protocol, and model/session types. Keep this package schema-only — no runtime logic.
- `packages/shared`: Shared runtime utilities consumed by both server and web. Uses explicit subpath exports (e.g. `@t3tools/shared/git`) — no barrel index.

## Codex App Server (Important)

T3 Code is currently Codex-first. The server starts `codex app-server` (JSON-RPC over stdio) per provider session, then streams structured events to the browser through WebSocket push messages.

How we use it in this codebase:

- Session startup/resume and turn lifecycle are brokered in `apps/server/src/codexAppServerManager.ts`.
- Provider dispatch and thread event logging are coordinated in `apps/server/src/providerManager.ts`.
- WebSocket server routes NativeApi methods in `apps/server/src/wsServer.ts`.
- Web app consumes orchestration domain events via WebSocket push on channel `orchestration.domainEvent` (provider runtime activity is projected into orchestration events server-side).

Docs:

- Codex App Server docs: https://developers.openai.com/codex/sdk/#app-server

## Reference Repos

- Open-source Codex repo: https://github.com/openai/codex
- Codex-Monitor (Tauri, feature-complete, strong reference implementation): https://github.com/Dimillian/CodexMonitor

Use these as implementation references when designing protocol handling, UX flows, and operational safeguards.

## Dinocode Tasks

Dinocode tracks its own work as flat-file tasks in `.dinocode/tasks/` (long term) and today dogfoods the same idea via [`beans`](https://github.com/hmans/beans) in `.beans/`. Agents should treat these files as first-class context.

### Discovery

- Task files live under `.beans/` (migrating to `.dinocode/tasks/` per `dinocode-fj6n`).
- Each file is Markdown + YAML front matter, named `<prefix><id>--<slug>.md`.
- Preferred discovery: use the `beans` CLI (already primed via `beans prime`) — or, once the dinocode CLI ships (`packages/dinocode-cli`), `dinocode task list --ready`.

### Working on a task

1. Pick an unblocked task with `beans list --ready --json` (or `dinocode task list --ready --json`).
2. Mark it `in-progress` before touching code: `beans update <id> -s in-progress`.
3. Keep the body's todo checklist current as you work.
4. On completion, add a `## Summary of Changes` section and mark the task `completed`.
5. Include both the code changes and the task file in the same commit.

### ETag optimistic concurrency

All task mutations are ETag-guarded:

- `beans show <id> --etag-only` to read the current ETag.
- `beans update <id> --if-match "$ETAG" ...` to guard against clobbering.
- The server dispatches `task.conflict` when the watcher re-ingests an external edit whose ETag no longer matches; the UI surfaces a three-way merge.

### Built-in tools (coming, Phase 4)

Inside provider adapters (Codex, Claude), Dinocode registers native function-calling tools that let the agent work with tasks without shelling out:

- `dinocode_list_tasks`, `dinocode_view_task`, `dinocode_create_task`, `dinocode_update_task`, `dinocode_link_tasks`, `dinocode_archive_task`.

These are richer than the CLI (real-time, typed, no shell escaping) but require the provider adapter to be wired. The CLI always works.

### Self-priming

- `beans prime` emits the canonical agent instructions for beans usage.
- Once the dinocode CLI ships, `dinocode prime` will emit the full Dinocode-tailored reference (tasks, threads, kanban, home-agent commands). This bean (`dinocode-3v4w`) tracks shipping `dinocode prime`; in the meantime, read `.docs/dinocode-for-agents.md` for the long-form guide.

### Integration-point rule

Every Dinocode feature lives in a `packages/dinocode-*` package. When a change in `apps/*` or `packages/contracts/*` wires a Dinocode package in, add a one-line comment:

```ts
// dinocode-integration: <package> <feature>
```

This makes `rg 'dinocode-integration'` a complete map of the t3code ↔ dinocode coupling surface. See [`docs/dinocode-packages.md`](docs/dinocode-packages.md) for the full policy.

### Further reading for agents

- [`.docs/dinocode-for-agents.md`](.docs/dinocode-for-agents.md) — long-form agent guide (task schema, CLI cheat sheet, home-agent protocol).
- [`DINOCODE.md`](DINOCODE.md) — canonical architecture + data model.
- [`docs/dinocode-packages.md`](docs/dinocode-packages.md) — package boundaries.
- [`docs/dinocode-browser.md`](docs/dinocode-browser.md) — built-in browser subsystem.
