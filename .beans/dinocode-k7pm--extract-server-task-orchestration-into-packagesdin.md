---
# dinocode-k7pm
title: Extract server task orchestration into packages/dinocode-server
status: todo
type: task
priority: high
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T03:39:22Z
---

Move task-specific orchestration code out of apps/server/src/orchestration/_ and apps/server/src/persistence/_ into a new packages/dinocode-server package that exposes Effect layers apps/server mounts at startup. Target sources: task additions to apps/server/src/orchestration/{commandInvariants,decider,projector,runtimeLayer}.ts and Layers/{OrchestrationEngine,ProjectionPipeline,ProjectionSnapshotQuery}.ts; apps/server/src/persistence/{Services,Layers}/ProjectionTasks.ts; apps/server/src/persistence/Migrations/026_ProjectionTasks.ts; task RPC methods in apps/server/src/ws.ts. Dinocode SQLite tables should live in a separate database file or under a migration id range reserved for dinocode. Keep apps/server's file-set changes down to a single-line layer mount. See docs/dinocode-packages.md.
