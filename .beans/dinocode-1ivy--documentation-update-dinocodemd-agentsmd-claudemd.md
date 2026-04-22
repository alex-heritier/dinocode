---
# dinocode-1ivy
title: 'Documentation: update DINOCODE.md, AGENTS.md, CLAUDE.md, README, KEYBINDINGS'
status: todo
type: task
priority: normal
tags:
    - docs
created_at: 2026-04-22T07:42:00Z
updated_at: 2026-04-22T07:42:00Z
parent: dinocode-xd5m
---

Keep user-facing and agent-facing docs in sync as the feature lands.

## Subtasks

### DINOCODE.md
- [ ] Fill in §15 "Decisions" with resolved open questions
- [ ] Update §11 Phases checklist as tasks land
- [ ] Add "Installation" section (CLI + desktop)

### AGENTS.md / CLAUDE.md
- [ ] New top-level section "Dinocode tasks" describing discovery + tool usage
- [ ] Include the one-line `dinocode prime` command so agents know how to self-prime

### README.md
- [ ] Rebrand headline, add tagline
- [ ] Screenshots of board, detail panel, home agent
- [ ] Quick-start: install → `dinocode init` → create first task

### KEYBINDINGS.md
- [ ] Full kanban + detail-panel bindings table
- [ ] Note overridable via user settings

### docs/ (developer docs)
- [ ] Architecture diagram for the task pipeline
- [ ] How to add a new orchestration command (walkthrough)
- [ ] How to add a new built-in tool (walkthrough)

### Acceptance
- [ ] All docs link-checked with a CI step (`markdown-link-check`)
