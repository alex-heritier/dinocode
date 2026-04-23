---
# dinocode-dizj
title: Dinocode v0.2 — Agent Tools & Automation
status: todo
type: milestone
priority: normal
created_at: 2026-04-22T07:11:34Z
updated_at: 2026-04-23T03:42:01Z
blocked_by:
  - dinocode-nvvq
---

Phases 4–5: dinocode CLI, built-in provider tools, dependency linking UI, unblock notifications, subtask completion, home agent.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
