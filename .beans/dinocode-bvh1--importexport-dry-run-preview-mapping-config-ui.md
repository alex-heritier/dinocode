---
# dinocode-bvh1
title: Import/export dry-run preview + mapping config UI
status: todo
type: task
priority: low
tags:
  - phase-6
  - integrations
created_at: 2026-04-22T07:40:10Z
updated_at: 2026-04-22T07:40:10Z
parent: dinocode-0ub1
---

Shared preview flow used by both GitHub and Linear importers/exporters before any destructive operation.

## Subtasks

- [ ] Side-by-side preview table: source column / target column / action (create/update/skip)
- [ ] Row-level toggles to skip specific items
- [ ] Editable mapping table (e.g. Linear state → Dinocode status) persisted in `.dinocode/config.yml` under `imports.<provider>.mapping`
- [ ] "Apply" button actually runs; progress bar with per-item success/fail
- [ ] Session log persisted for audit: `.dinocode/.sessions/imports/<provider>-<timestamp>.json`
- [ ] Tests cover mapping persistence and resume-after-partial-failure
