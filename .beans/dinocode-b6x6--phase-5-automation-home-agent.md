---
# dinocode-b6x6
title: "Phase 5: Automation & Home Agent"
status: todo
type: epic
priority: normal
created_at: 2026-04-22T07:11:39Z
updated_at: 2026-04-23T03:42:01Z
parent: dinocode-dizj
---

Dependency linking UI, unblock notifications, subtask completion prompts, sidebar home agent with injected task management knowledge.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
