---
# dinocode-xd5m
title: Dinocode cross-cutting concerns (all versions)
status: todo
type: epic
priority: high
tags:
  - cross-cutting
created_at: 2026-04-22T07:40:21Z
updated_at: 2026-04-23T03:42:01Z
blocking:
  - dinocode-nvvq
  - dinocode-dizj
  - dinocode-p06t
---

Concerns that do not fit a single phase but must ship as part of the overall Dinocode effort: rebrand, observability, tests, accessibility, performance, migration, docs, and handling of open questions from DINOCODE.md §12.

## Direction update (2026-04-23)

All code work under this epic lands in Dinocode-owned packages, not in `apps/server/src/`, `apps/web/src/`, or `packages/contracts/src/`. Target packages per `docs/dinocode-packages.md`: `packages/soil`, `packages/dinocode-contracts`, `packages/dinocode-server`, `packages/dinocode-board`, `packages/dinocode-cli`, `packages/dinocode-agent-tools`. Integration into `apps/*` is a thin wire-up annotated with `dinocode-integration:` comments. See child beans for per-task direction notes.
