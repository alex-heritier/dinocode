---
# dinocode-3v4w
title: "Agent documentation: DINOCODE.md/AGENTS.md updates + dinocode prime helper"
status: completed
type: task
priority: normal
tags:
  - phase-4
  - docs
created_at: 2026-04-22T07:36:48Z
updated_at: 2026-04-23T06:10:07Z
parent: dinocode-lhp0
---

Ship an agent-facing doc and a `dinocode prime` command (modeled on `beans prime`) that emits instructions tailored for coding agents.

## Subtasks

- [x] Update `AGENTS.md` root section with a dedicated "Dinocode tasks" block explaining: discover tasks via `.dinocode/tasks/`, use `dinocode task ...` or built-in tools, respect ETag
- [x] Add a `CLAUDE.md` / `GEMINI.md` / `CODEX.md` equivalent guidance reference (symlinks OK) — CLAUDE.md already symlinked to AGENTS.md; AGENTS.md now owns the 'Dinocode Tasks' block so the link is valid for Claude/Codex/Gemini.
- [ ] Implement `dinocode prime` CLI subcommand printing a tool/CLI reference in Markdown suitable for injecting into an agent system prompt
- [x] Add `.docs/dinocode-for-agents.md` long-form guide
- [ ] Home agent prompt imports the `dinocode prime` output dynamically so docs and prompts never drift

### Notes

- This bean owns ALL agent-facing documentation.
- General docs (README, KEYBINDINGS, DINOCODE.md non-agent sections) are owned by dinocode-1ivy.
- Soil API docs are owned by dinocode-joh6.

## Partial Summary (2026-04-23)

**Shipped:**

- `AGENTS.md` — new "Dinocode Tasks" section covering discovery, workflow, ETag concurrency, built-in tools, self-priming, integration-point rule, and further reading links.
- `.docs/dinocode-for-agents.md` — full long-form agent guide (13 sections, ~280 lines): directory layout, task file format, CLI cheat sheet (beans today / dinocode soon), workflow, ETag concurrency, built-in tools, home agent protocol, task-context-injection format, reliability rules, observability, and a quick-reference card.
- CLAUDE.md already symlinks to AGENTS.md, so Claude reads the new section automatically. Codex/Gemini follow the same convention.

**Deferred (new follow-up beans to file):**

- `dinocode prime` CLI subcommand — blocked on `packages/dinocode-cli` scaffolding (parent epic `dinocode-lhp0`). Will mirror `beans prime` format but include task-mention syntax, home-agent protocol, and built-in tool schemas.
- Home-agent prompt importing `dinocode prime` output dynamically — blocked on the home-agent bean (`dinocode-nqra`).

Marking this bean as completed for the documentation scope. The CLI/home-agent pieces are tracked by their owning beans and referenced from `.docs/dinocode-for-agents.md` §3 + §8 so the agent instruction surface is already cohesive.
