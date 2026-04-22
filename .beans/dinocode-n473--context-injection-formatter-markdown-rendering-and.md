---
# dinocode-n473
title: 'Context injection formatter: Markdown rendering and token budgeting'
status: todo
type: feature
priority: high
tags:
    - phase-3
    - context
created_at: 2026-04-22T07:35:43Z
updated_at: 2026-04-22T07:35:43Z
parent: dinocode-0apu
blocked_by:
    - dinocode-56yo
---

The server-side `TaskContextInjector` must produce a well-formatted, predictable Markdown block that fits within provider-specific token budgets. Split this out from the larger `dinocode-56yo` task to get detailed coverage.

## Subtasks

### Format
- [ ] Top heading: "You are working on the following task(s):"
- [ ] Per-task block: `### [id] title`, then fields list (Status, Type, Priority, Blocked by, Tags), then `## Goal / ## Acceptance Criteria / ## Notes` from task body
- [ ] Preserve checklist syntax (`- [x]`) so providers see progress
- [ ] Separator between tasks: `---`

### Token budget
- [ ] Shared `estimateTokens(str)` util (tiktoken-style heuristic; exact count not required)
- [ ] Hard cap: 8k tokens for the combined block (configurable per-provider later)
- [ ] Truncation strategy: drop body paragraphs (keep acceptance criteria), then drop lowest-priority tasks, then summarize

### Per-provider handling
- [ ] Codex: prepend to first user message (as spec §5.2 says)
- [ ] Claude: prepend to first user message
- [ ] Cursor / OpenCode: TBD — research and document
- [ ] Behind feature flag `providerSupportsSystemTaskContext` in case any provider later supports a dedicated context mechanism

### Tests
- [ ] Snapshot test: single task, multiple tasks, truncation path
- [ ] Tokens under cap for 10-task fixture
- [ ] Body with special chars (backticks, `---`) rendered correctly
