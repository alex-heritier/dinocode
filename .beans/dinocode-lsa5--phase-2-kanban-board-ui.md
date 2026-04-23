---
# dinocode-lsa5
title: "Phase 2: Kanban Board UI"
status: in-progress
type: epic
priority: high
created_at: 2026-04-22T07:11:28Z
updated_at: 2026-04-23T03:42:00Z
parent: dinocode-nvvq
blocked_by:
  - dinocode-x8dw
---

Board projection, RPC streams, React kanban route, components (Board/Column/Card/DetailPanel), drag-and-drop, and store slices.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
