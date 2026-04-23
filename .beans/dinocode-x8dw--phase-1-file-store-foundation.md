---
# dinocode-x8dw
title: "Phase 1.5: Server Orchestration Integration"
status: in-progress
type: epic
priority: high
created_at: 2026-04-22T07:11:28Z
updated_at: 2026-04-23T03:42:00Z
parent: dinocode-nvvq
blocked_by:
  - dinocode-0syf
---

Server-side orchestration integration on top of Soil: contracts, migrations, command invariants, projector updates, bootstrap seeding, server FileStore adapter, watcher wiring, and filesystem projection.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
