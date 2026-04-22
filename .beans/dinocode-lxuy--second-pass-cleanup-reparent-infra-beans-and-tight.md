---
# dinocode-lxuy
title: 'Second-pass cleanup: reparent infra beans and tighten docs scope'
status: completed
type: task
priority: normal
created_at: 2026-04-22T12:51:21Z
updated_at: 2026-04-22T12:52:46Z
---

Follow-up to the spec-bean alignment audit. Reparent misplaced infrastructure beans, resolve docs bean overlap, and verify no remaining overly broad beans.

## Tasks

- [x] Reparent dinocode-3230 (SQLite FTS5) from server integration to cross-cutting epic
- [x] Clarify docs bean boundaries: dinocode-1ivy (broad docs), dinocode-3v4w (agent docs), dinocode-joh6 (soil API docs)
- [x] Verify no remaining broad cross-cutting beans need splitting
- [x] Summarize changes

## Summary of Changes

- Reparented `dinocode-3230` from `dinocode-x8dw` (Phase 1.5 server integration) to `dinocode-xd5m` (cross-cutting concerns), added `infrastructure` and `phase-6` tags
- Appended scope boundary notes to all three docs beans so ownership is explicit:
  - `dinocode-1ivy`: general docs (README, KEYBINDINGS, DINOCODE.md, developer docs)
  - `dinocode-3v4w`: agent-facing docs (AGENTS.md agent section, dinocode prime)
  - `dinocode-joh6`: Soil package API docs
- Verified remaining cross-cutting beans (`dinocode-3r7y`, `dinocode-dc75`, `dinocode-h3nk`, `dinocode-8ibz`, `dinocode-nvy8`, `dinocode-jabn`, `dinocode-mdhg`, `dinocode-e58v`, `dinocode-fj6n`) all have detailed subtask lists and are actionable

## Remaining Risks

- None identified. The bean graph is now clean, well-parented, and actionable.
