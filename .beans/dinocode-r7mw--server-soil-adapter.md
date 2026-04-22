---
# dinocode-r7mw
title: Server soil adapter
status: todo
type: task
priority: normal
created_at: 2026-04-22T08:30:24Z
updated_at: 2026-04-22T12:40:56Z
parent: dinocode-lhp0
blocked_by:
    - dinocode-0syf
    - dinocode-mswb
    - dinocode-e0e8
---

Thin adapter layer in apps/server that wires soil modules into the orchestration engine: FileStore service uses soil/reactor, RPC handlers use soil/projector, watcher feeds events to soil/decider.
