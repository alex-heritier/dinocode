---
# dinocode-t3r7
title: Re-audit DINOCODE spec and beans alignment
status: completed
type: task
priority: normal
created_at: 2026-04-22T12:46:12Z
updated_at: 2026-04-22T12:49:59Z
---

Review the updated DINOCODE.md against the full bean graph. Identify remaining doc/bean mismatches, dependency mistakes, hierarchy issues, and beans that are too broad or too vague to be actionable. Fix straightforward issues directly and summarize any deeper follow-up work.

## Tasks

- [x] Review DINOCODE.md sections against current bean structure
- [x] Review the full bean graph for hierarchy and dependency consistency
- [x] Identify beans that are too broad or insufficiently actionable
- [x] Fix straightforward bean metadata/body issues discovered during audit
- [x] Summarize remaining gaps and risks

## Summary of Changes

- Moved `dinocode-0syf` (Soil Package) under the v0.1 milestone and raised its priority so the milestone structure matches `DINOCODE.md`
- Retitled `dinocode-x8dw` to `Phase 1.5: Server Orchestration Integration`, updated its body, and made it explicitly blocked by the Soil epic
- Updated `dinocode-nvvq` milestone body so v0.1 now describes Soil foundation + server integration + kanban + task context injection
- Retargeted `dinocode-j3do` and `dinocode-6uwn` from server-local reimplementation work to thin server adapter / reactor integration work on top of Soil
- Added the missing dependency from watcher integration (`dinocode-xd4c`) to bootstrap seeding (`dinocode-7xp4`)
- Scrapped duplicate pre-Soil beans: `dinocode-q03l`, `dinocode-388g`, `dinocode-udzs`, `dinocode-wih3`, `dinocode-9f1s`, each with explicit reasons
- Repointed stale blockers: `dinocode-sizc` now depends on `dinocode-8u6r`, and `dinocode-lc1k` now depends on `dinocode-e0e8`
- Fixed stale or non-portable bean text in `dinocode-1ivy` and `dinocode-3085`

## Remaining Risks

- `dinocode-3230` is still parented under the server integration epic even though it mainly unlocks search features in later phases; this is acceptable as shared infra, but could be reparented later if the search roadmap becomes more formalized
- The bean file path/slug for `dinocode-x8dw` still reflects the old Phase 1 name; metadata is correct, but the filename is now historically stale
- `dinocode-1ivy`, `dinocode-3v4w`, and `dinocode-joh6` overlap slightly in docs ownership, but their scopes are still workable: broad docs sync, agent docs/prime, and Soil API docs respectively
