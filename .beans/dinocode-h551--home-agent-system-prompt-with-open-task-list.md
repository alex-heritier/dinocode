---
# dinocode-h551
title: Home agent system prompt with open task list
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:14:50Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-0apu
blocked_by:
  - dinocode-56yo
---

When the `__home_agent__:<projectId>` thread starts a turn, inject a compact list of open tasks (todo + in-progress) into the system prompt so the agent always has backlog awareness without needing to call a tool.

## Subtasks

### Prompt composition

- [ ] Dedicated system prompt section: "## Open Tasks"
- [ ] Include: `id`, `title`, `status`, `type`, `priority`, `blocked_by` (only if blockers exist)
- [ ] Sort by priority (critical → high → normal → low → deferred), then by `updated_at` desc
- [ ] Hard cap: first 40 tasks; if truncated, append "… and N more" and mention `dinocode_list_tasks` tool
- [ ] Token budget: ~1.5k tokens max for the task block; measure with a shared tokenizer util

### Server injection

- [ ] `HomeAgentPromptComposer` service in `apps/server/src/homeAgent/`
- [ ] Called by turn-start pipeline when threadId matches `__home_agent__:*` pattern
- [ ] Combines: base home-agent system prompt + open-tasks block + CLI usage reference

### CLI hint block

- [ ] Include a short "You can manipulate these tasks via:" block listing `dinocode_list_tasks`, `dinocode_view_task`, `dinocode_create_task`, `dinocode_update_task`

### Caching

- [ ] Compose fresh on every turn-start (list mutates frequently); no caching beyond a single request
- [ ] Budget: composing ≤10ms for projects with 500 open tasks

### Tests

- [ ] Snapshot test of composed prompt for fixture project (stable IDs/dates)
- [ ] Truncation kicks in at exactly 41 tasks

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
