---
# dinocode-r7mw
title: Server soil adapter
status: todo
type: task
priority: normal
created_at: 2026-04-22T08:30:24Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-lhp0
blocked_by:
  - dinocode-0syf
  - dinocode-mswb
  - dinocode-e0e8
---

Thin adapter layer in apps/server that wires soil modules into the orchestration engine: FileStore service uses soil/reactor, RPC handlers use soil/projector, watcher feeds events to soil/decider.

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
