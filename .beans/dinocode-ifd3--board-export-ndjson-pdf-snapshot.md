---
# dinocode-ifd3
title: "Board export: NDJSON + PDF snapshot"
status: todo
type: task
priority: low
tags:
  - phase-6
  - export
created_at: 2026-04-22T07:40:10Z
updated_at: 2026-04-22T07:40:10Z
parent: dinocode-0ub1
---

Let users export the current board (filtered state) for sharing or archival.

## Subtasks

- [ ] `dinocode export ndjson --output tasks.ndjson [--filter ...]`
- [ ] UI action "Export board" in filter bar → downloads NDJSON
- [ ] PDF snapshot: renders current board layout at 1600px wide, includes dependency overlay, exported via headless Chromium (main-process IPC)
- [ ] Markdown roadmap export: `dinocode export roadmap` emits a summary akin to `beans roadmap`
- [ ] Tests: NDJSON schema matches contract's `Task`
