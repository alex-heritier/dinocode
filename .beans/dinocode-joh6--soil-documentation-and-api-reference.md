---
# dinocode-joh6
title: Soil documentation and API reference
status: completed
type: task
priority: normal
created_at: 2026-04-22T08:30:26Z
updated_at: 2026-04-23T03:01:57Z
parent: dinocode-0syf
blocked_by:
  - dinocode-m5em
---

Document soil package public API: each subpath export, usage examples for server and CLI consumers. Update DINOCODE.md with soil architecture diagram.

### Notes

- This bean owns Soil package-specific API docs and architecture diagram updates.
- General docs (README, KEYBINDINGS, DINOCODE.md) are owned by dinocode-1ivy.
- Agent-facing docs (AGENTS.md agent section, dinocode prime) are owned by dinocode-3v4w.

## Summary of Changes

- Added `packages/soil/README.md` with: design principles, task file format, per-subpath API table, architecture diagram, usage examples for parsing/rendering, decider+projector, reactor, and watcher, plus a testing + stability note.
- Extended DINOCODE.md §9.2 (Soil Package API) with a link to the README and a subpath export table so the spec and package docs stay in sync.
- Ticked the documentation checkbox in the Phase 1 implementation checklist.
