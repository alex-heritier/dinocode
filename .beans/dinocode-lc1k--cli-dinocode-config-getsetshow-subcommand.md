---
# dinocode-lc1k
title: "CLI: dinocode config get/set/show subcommand"
status: todo
type: task
priority: normal
tags:
  - phase-4
  - cli
created_at: 2026-04-22T07:36:48Z
updated_at: 2026-04-22T12:49:22Z
parent: dinocode-lhp0
blocked_by:
  - dinocode-vaac
  - dinocode-e0e8
---

Inspect and modify `.dinocode/config.yml` from the CLI without hand-editing YAML.

## Subtasks

- [ ] `dinocode config show [--json]` — pretty prints resolved config (defaults applied)
- [ ] `dinocode config get <key>` — dotted key path, e.g. `tasks.prefix`
- [ ] `dinocode config set <key> <value>` — atomic write with validation via config schema
- [ ] `dinocode config validate` — parses and schema-checks; exit 0/1
- [ ] Error output uses the same `ConfigValidationError` messages as the server
