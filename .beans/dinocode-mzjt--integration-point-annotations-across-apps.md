---
# dinocode-mzjt
title: Integration-point annotations across apps/*
status: completed
type: task
priority: normal
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T06:04:16Z
---

For every t3code-internal file that wires a Dinocode package in, add a single 'dinocode-integration: <package> <feature>' comment on the integration line so rg 'dinocode-integration' surfaces the complete coupling surface. Enforce in CI with a small script that fails if a file under apps/_ imports from @dinocode/_ without such a comment within 3 lines. See docs/dinocode-packages.md.

## Summary of Changes

Added `dinocode-integration:` comments at every coupling point across `apps/*` and `packages/contracts/*` so `rg 'dinocode-integration'` now surfaces the complete surface between t3code internals and Dinocode additions.

New annotations added (in addition to the ones already present for the kanban face-toggle):

- `packages/contracts/src/orchestration.ts` — task WS method names + task schema block.
- `packages/contracts/src/rpc.ts` — subscribeBoard + subscribeTask RPC definitions.
- `apps/server/src/ws.ts` — board stream task fan-out, subscribeBoard handler, subscribeTask handler, task-related contract imports.
- `apps/server/src/orchestration/commandInvariants.ts` — `findTaskById`/`requireTask*` helpers.
- `apps/server/src/orchestration/decider.ts` — `task.*` command cases.
- `apps/server/src/orchestration/projector.ts` — `task.*` read-model projection cases.
- `apps/server/src/orchestration/runtimeLayer.ts` — task projection layer wiring.
- `apps/server/src/orchestration/Layers/OrchestrationEngine.ts` — task command → aggregate routing.
- `apps/server/src/orchestration/Layers/ProjectionPipeline.ts` — task repository imports, `applyTasksProjection`, tasks projector registration.
- `apps/server/src/orchestration/Layers/ProjectionSnapshotQuery.ts` — task repository import.
- `apps/server/src/orchestration/Services/ProjectionSnapshotQuery.ts` — `getBoardSnapshotByProjectId` declaration.
- `apps/server/src/persistence/Migrations.ts` — `Migration0026` import.
- `apps/server/src/persistence/Migrations/026_ProjectionTasks.ts` — file header.
- `apps/server/src/persistence/Services/ProjectionTasks.ts` — file header.
- `apps/server/src/persistence/Layers/ProjectionTasks.ts` — file header.
- `apps/server/src/persistence/Services/OrchestrationCommandReceipts.ts` — TaskId in aggregate union.
- `apps/server/src/persistence/Layers/OrchestrationEventStore.ts` — TaskId in streamId union.
- `apps/server/integration/OrchestrationEngineHarness.integration.ts` — task projection harness wiring.
- `apps/web/src/components/board/KanbanBoard.tsx`, `KanbanCard.tsx`, `KanbanColumn.tsx`, `TaskCreateForm.tsx` — file headers (pure-dinocode components).
- `apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx`, `_chat.board.index.tsx` — file headers (pure-dinocode routes).

## Deferred

The CI guard (flag new additions in `apps/*` that import from `@dinocode/*` without an annotation within 3 lines) is tracked by dinocode-yr6l. That work depends on the dinocode-\* packages existing (extraction beans dinocode-fm1h, dinocode-k7pm, dinocode-up4r), so it remains open.

## Verification

- `bun fmt`, `bun lint`, `bun typecheck` all pass.
