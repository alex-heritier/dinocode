---
# dinocode-nvvq
title: Dinocode v0.1 — File Store + Kanban MVP
status: todo
type: milestone
priority: high
created_at: 2026-04-22T07:11:20Z
updated_at: 2026-04-23T03:42:01Z
---

First shippable release combining t3code, beans file-first task model, and kanban board. Covers Soil package foundation, server orchestration integration, kanban UI, and task context injection.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
