---
# dinocode-9f1s
title: Shared FileStore code module (reuse across server + CLI)
status: scrapped
type: feature
priority: normal
tags:
  - phase-4
  - refactor
created_at: 2026-04-22T07:37:22Z
updated_at: 2026-04-22T12:49:22Z
parent: dinocode-lhp0
blocked_by:
  - dinocode-0syf
---

The server's FileStore (parser/writer/etag/config) must be reusable from the CLI (which does NOT run the server). Extract the core pure logic into `packages/shared/src/fileStore/` with explicit subpath exports.

## Subtasks

- [ ] Create `packages/shared/src/fileStore/` directory
- [ ] Add subpath exports: `"./fileStore/parser"`, `"./fileStore/writer"`, `"./fileStore/etag"`, `"./fileStore/config"`, `"./fileStore/ignoredPaths"`
- [ ] No `index.ts` barrel — each consumer imports the specific subpath
- [ ] Move pure functions from `apps/server/src/fileStore/` into shared module
- [ ] Server's `FileStoreLive` layer becomes a thin wrapper (IO + watcher remain server-only because they need Node `fs.watch`)
- [ ] CLI imports directly from `@t3tools/shared/fileStore/*`
- [ ] Verify bundle sizes: shared modules tree-shake cleanly in both contexts
- [ ] Tests: parser + writer tests moved to shared package, re-exported test helpers for integration in both consumers

## Reasons for Scrapping

Superseded by the Soil package plan (`dinocode-0syf`). The old extraction target of `packages/shared/src/fileStore/` no longer matches the architecture; reusable parser/writer/ETag logic now belongs in `packages/soil`.
