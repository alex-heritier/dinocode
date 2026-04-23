---
# dinocode-0ub1
title: "Phase 6: Polish & Integrations"
status: todo
type: epic
priority: low
created_at: 2026-04-22T07:11:39Z
updated_at: 2026-04-23T03:42:01Z
parent: dinocode-p06t
---

GitHub Issues/Linear import-export, mobile-responsive kanban, advanced task search and filter UI.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
