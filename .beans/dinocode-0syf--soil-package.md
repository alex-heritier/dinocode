---
# dinocode-0syf
title: Soil Package
status: todo
type: epic
priority: normal
created_at: 2026-04-22T08:28:26Z
updated_at: 2026-04-22T08:31:38Z
---

Standalone file-first task domain package (packages/soil). Owns YAML front-matter parsing, fractional indexing, conflict resolution, decider/projector/reactor, and project config loading. Consumed by apps/server and apps/cli. No WebSocket/RPC/HTTP awareness.



## Modules

- [ ] Scaffold packages/soil (dinocode-e2wm)
- [ ] Task schema types and validation (dinocode-5ley)
- [ ] Fractional index utility (dinocode-8u6r)
- [ ] Task ID generator (dinocode-3p5v)
- [ ] FileStore core — parser, writer, etag (dinocode-cy2j)
- [ ] Decider — command → event state machine (dinocode-7jwg)
- [ ] Projector — event → state projection (dinocode-e7qu)
- [ ] Reactor — event → file system writes (dinocode-mswb)
- [ ] Config and project loader (dinocode-e0e8)
- [ ] Conflict resolution and ETag handling (dinocode-lfdu)
- [ ] Error taxonomy (dinocode-bv5n)
- [ ] Search and filter utilities (dinocode-qga1)
- [ ] Migration utilities (dinocode-jo0q)
- [ ] Test suite (dinocode-m5em)
- [ ] Documentation and API reference (dinocode-joh6)

## Consumers

- apps/server — via thin adapter (dinocode-r7mw)
- apps/cli — direct imports, no server required
