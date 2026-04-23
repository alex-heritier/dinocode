---
# dinocode-mdhg
title: 'Data migration: schema evolution strategy for future task-schema changes'
status: completed
type: task
priority: low
tags:
    - migration
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-23T03:23:49Z
parent: dinocode-xd5m
---

Task front-matter will evolve. Define a forward/backward-compatible evolution strategy now to avoid breakage later.

## Subtasks

- [ ] Introduce `schemaVersion: number` in front-matter (default 1, optional, omitted means 1)
- [ ] Parser tolerates unknown fields (preserved byte-for-byte on rewrite)
- [ ] Writer adds `schemaVersion` only when > 1
- [ ] Migration runner: `dinocode migrate` CLI walks tasks, applies registered migrations
- [ ] Versioned migrations under `apps/cli/src/migrations/v1-to-v2.ts`, `v2-to-v3.ts`
- [ ] Dry-run mode default; write needs `--apply`



## Resolution

Strategy spec lives at `docs/soil-migrations.md`. Soil library ships the scaffolded infrastructure even though no v2 migration exists yet:

- `CURRENT_TASK_SCHEMA_VERSION = 1`
- `DEFAULT_MIGRATIONS: readonly TaskSchemaMigration[] = []`
- `TaskSchemaMigration` interface (pure `apply` + optional `invert`)
- `runSchemaMigrations(raw, { from, to, registry })` — pure, idempotent at current version, rejects downgrades without explicit inverter
- `assertMigrationsFormChain()` — fails at import time if a registered chain skips a version
- `schema_version` field absent ≡ v1 (canonical)
- Unknown-field preservation is documented as the contract; full AST-backed implementation is deferred to the first v2 migration.

### Tests

`packages/soil/src/soil.test.ts` adds 5 new cases (registry empty-chain invariant, v1 no-op run, downgrade rejection, non-chain registry rejection, synthetic v1→v2 end-to-end).

### Deferred

- Unknown-field byte-preservation across reads/writes (ships with first v2 migration once a concrete field removal makes this a real requirement)
- CLI `dinocode migrate` subcommand (spec'd; implementation lands in dinocode-vaac / dinocode-e5he)
