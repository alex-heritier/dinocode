---
# dinocode-56yo
title: Extend thread.turn.start to accept taskIds context
status: todo
type: feature
priority: high
created_at: 2026-04-22T07:14:50Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-0apu
---

Server-side: extend TurnStartCommand schema with optional taskIds field. Implement context injector service that reads task files and formats context string. Inject before provider adapter starts.

## Subtasks

- [ ] Add `taskIds?: TaskId[]` to `TurnStartCommand` schema in `packages/contracts/src/orchestration.ts`
- [ ] Create `TaskContextInjector` service in `apps/server/src/orchestration/Services/`
- [ ] Implement `formatTaskContext(tasks: Task[]): string` — renders each task as formatted Markdown block matching spec §5.2
- [ ] In provider adapter startup (before sending first user message): call `TaskContextInjector.formatTaskContext` if `taskIds` present
- [ ] Fetch tasks from `OrchestrationReadModel.tasks` by ID (skip missing IDs with warning)
- [ ] Prepend formatted context to the user's first message (not system prompt, to avoid provider-specific system prompt limits)
- [ ] Persist `taskIds` on the thread record in SQLite for display in the UI
- [ ] Run `bun typecheck` — no new errors

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
