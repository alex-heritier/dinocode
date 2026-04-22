---
# dinocode-yzge
title: "Telemetry: anonymous usage metrics (opt-in) for Dinocode features"
status: todo
type: task
priority: low
tags:
  - observability
created_at: 2026-04-22T07:41:46Z
updated_at: 2026-04-22T07:41:46Z
parent: dinocode-xd5m
---

Understand which features are used to guide iteration, strictly opt-in and PII-free.

## Subtasks

- [ ] Extend existing analytics service (`apps/server/src/telemetry/`) with `dinocode.*` event namespace
- [ ] Track (aggregated counts only): `board_opened`, `task_created`, `task_completed`, `session_started_with_context`, `home_agent_used`, `link_created`
- [ ] NO payloads beyond event names + coarse counts + OS/version
- [ ] Opt-in on first launch; decline is default for users who dismiss the dialog
- [ ] Settings panel toggle to turn on/off at any time
- [ ] Documentation in DINOCODE.md of exactly what is collected
