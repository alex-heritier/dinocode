---
# dinocode-h551
title: Home agent system prompt with open task list
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:14:50Z
updated_at: 2026-04-22T07:35:02Z
parent: dinocode-0apu
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
- [ ] Combines: base home-agent system prompt + open-tasks block + CLI usage reference (from dinocode-w94z task)

### CLI hint block
- [ ] Include a short "You can manipulate these tasks via:" block listing `dinocode_list_tasks`, `dinocode_view_task`, `dinocode_create_task`, `dinocode_update_task`

### Caching
- [ ] Compose fresh on every turn-start (list mutates frequently); no caching beyond a single request
- [ ] Budget: composing ≤10ms for projects with 500 open tasks

### Tests
- [ ] Snapshot test of composed prompt for fixture project (stable IDs/dates)
- [ ] Truncation kicks in at exactly 41 tasks
