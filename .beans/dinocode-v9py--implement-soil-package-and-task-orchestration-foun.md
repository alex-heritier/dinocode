---
# dinocode-v9py
title: Implement Soil package and task orchestration foundation
status: in-progress
type: epic
priority: high
created_at: 2026-04-22T12:57:45Z
updated_at: 2026-04-22T14:58:06Z
---

Scaffold packages/soil, define task schemas, build FileStore parser/writer/ETag, implement decider/projector, add orchestration contracts, server integration, migration, and basic kanban UI.

## Progress Summary

### Completed Beans

- **packages/soil**: scaffold (e2wm), schema (5ley), errors (bv5n), ID generator (3p5v), fractional index (8u6r), config (e0e8), decider (7jwg), projector (e7qu), FileStore core (cy2j)
- **packages/contracts**: task schema types (8izj), task RPC methods (afya)
- **apps/server**: decider commands (8tuq), projector events (j5i8), migration (y758), subscribeBoard+subscribeTask handlers (y3d7)
- **apps/web**: KanbanBoard (sizc), KanbanCard (0qbh), KanbanColumn (ifhu), board route (w1uo)

### Remaining Work

- Soil: reactor (mswb), conflict resolution (lfdu), search utils (qga1), migration utils (jo0q), tests (m5em), docs (joh6)
- Server: FileStore adapter (j3do), watcher integration (xd4c), project seeding (7xp4), conflict events (4sv1), reactor integration (6uwn)
- Web: TaskDetailPanel, filter bar, keyboard shortcuts, empty states, DnD
