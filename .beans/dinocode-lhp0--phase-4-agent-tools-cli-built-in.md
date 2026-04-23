---
# dinocode-lhp0
title: "Phase 4: Agent Tools (CLI + Built-in)"
status: todo
type: epic
priority: normal
created_at: 2026-04-22T07:11:39Z
updated_at: 2026-04-23T03:42:00Z
parent: dinocode-dizj
blocked_by:
  - dinocode-0syf
---

dinocode task CLI subcommands, npx install, built-in function-calling tools for Codex/Claude adapters.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
