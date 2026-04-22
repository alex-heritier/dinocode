---
# dinocode-7o6v
title: 'CLI: dinocode doctor — diagnose common setup issues'
status: todo
type: task
priority: low
tags:
    - phase-4
    - cli
created_at: 2026-04-22T07:36:48Z
updated_at: 2026-04-22T07:36:48Z
parent: dinocode-lhp0
---

`dinocode doctor` runs a battery of health checks and prints actionable suggestions. Useful for bug reports and CI.

## Subtasks

- [ ] Checks: `.dinocode/` exists, `config.yml` parses, all `tasks/*.md` parse, no duplicate IDs, no dangling `parent`/`blocking`/`blocked_by` references, archive dir exists
- [ ] Tasks directory stats: total / by-status / by-type counts
- [ ] Orphaned `archive/*.md` files not reflected in any `tasks/*.md` metadata (if schema demanded it)
- [ ] JSON output `--json` with `{ok: bool, checks: [{name, status, detail?}]}`
- [ ] Non-zero exit on any failure
