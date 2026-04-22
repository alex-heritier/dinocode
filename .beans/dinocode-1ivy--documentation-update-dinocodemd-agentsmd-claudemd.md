---
# dinocode-1ivy
title: 'Documentation: update DINOCODE.md, AGENTS.md, CLAUDE.md, README, KEYBINDINGS'
status: in-progress
type: task
priority: normal
tags:
    - docs
created_at: 2026-04-22T07:42:00Z
updated_at: 2026-04-22T12:52:10Z
parent: dinocode-xd5m
---

Keep user-facing and agent-facing docs in sync as the feature lands.

## Subtasks

### DINOCODE.md
- [ ] Keep `DINOCODE.md` architecture, phase names, and open-question references aligned with the current Soil-based plan
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

## Progress Notes

- Updated `DINOCODE.md` to reflect the Soil-based architecture: `packages/soil` is now documented as the canonical shared task-domain layer, the server FileStore is described as a thin adapter, and the implementation phases now distinguish Soil foundation work from server orchestration integration.



### Notes
- Agent-facing docs (AGENTS.md agent section, dinocode prime) are owned by dinocode-3v4w.
- Soil API docs are owned by dinocode-joh6.
- This bean covers everything else: README, KEYBINDINGS, DINOCODE.md non-agent sections, developer docs, general AGENTS.md/CLAUDE.md updates.
