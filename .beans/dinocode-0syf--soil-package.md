---
# dinocode-0syf
title: Soil Package
status: in-progress
type: epic
priority: high
created_at: 2026-04-22T08:28:26Z
updated_at: 2026-04-22T15:25:42Z
parent: dinocode-nvvq
---

Standalone file-first task domain package (packages/soil). Owns YAML front-matter parsing, fractional indexing, conflict resolution, decider/projector/reactor, and project config loading. Consumed by apps/server and apps/cli. No WebSocket/RPC/HTTP awareness.

## Modules

- [x] Scaffold packages/soil (dinocode-e2wm)
- [x] Task schema types and validation (dinocode-5ley)
- [x] Fractional index utility (dinocode-8u6r)
- [x] Task ID generator (dinocode-3p5v)
- [x] FileStore core — parser, writer, etag (dinocode-cy2j)
- [x] Decider — command → event state machine (dinocode-7jwg)
- [x] Projector — event → state projection (dinocode-e7qu)
- [x] Reactor — event → file system writes (dinocode-mswb)
- [x] Config and project loader (dinocode-e0e8)
- [x] Conflict resolution and ETag handling (dinocode-lfdu)
- [x] Error taxonomy (dinocode-bv5n)
- [x] Search and filter utilities (dinocode-qga1)
- [x] Migration utilities (dinocode-jo0q)
- [x] Test suite (dinocode-m5em)
- [ ] Documentation and API reference (dinocode-joh6)

## Consumers

- apps/server — via thin adapter (dinocode-r7mw)
- apps/cli — direct imports, no server required
