---
# dinocode-3v4w
title: "Agent documentation: DINOCODE.md/AGENTS.md updates + dinocode prime helper"
status: todo
type: task
priority: normal
tags:
  - phase-4
  - docs
created_at: 2026-04-22T07:36:48Z
updated_at: 2026-04-22T12:52:12Z
parent: dinocode-lhp0
---

Ship an agent-facing doc and a `dinocode prime` command (modeled on `beans prime`) that emits instructions tailored for coding agents.

## Subtasks

- [ ] Update `AGENTS.md` root section with a dedicated "Dinocode tasks" block explaining: discover tasks via `.dinocode/tasks/`, use `dinocode task ...` or built-in tools, respect ETag
- [ ] Add a `CLAUDE.md` / `GEMINI.md` / `CODEX.md` equivalent guidance reference (symlinks OK)
- [ ] Implement `dinocode prime` CLI subcommand printing a tool/CLI reference in Markdown suitable for injecting into an agent system prompt
- [ ] Add `.docs/dinocode-for-agents.md` long-form guide
- [ ] Home agent prompt imports the `dinocode prime` output dynamically so docs and prompts never drift

### Notes

- This bean owns ALL agent-facing documentation.
- General docs (README, KEYBINDINGS, DINOCODE.md non-agent sections) are owned by dinocode-1ivy.
- Soil API docs are owned by dinocode-joh6.
