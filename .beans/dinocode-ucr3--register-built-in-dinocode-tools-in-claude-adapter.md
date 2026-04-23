---
# dinocode-ucr3
title: Register built-in dinocode tools in Claude adapter
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:13Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-lhp0
---

Register the dinocode built-in tools (list/view/create/update/link/unlink) in the Claude provider adapter using shared tool definitions.

## Subtasks

- [ ] Import shared tool definitions from `apps/server/src/dinocodeTools/definitions.ts` (see dinocode-ndam)
- [ ] In `ClaudeAdapter.ts`, extend the tool registration to include dinocode tools when `.dinocode/` is initialized for the session's project
- [ ] Translate shared tool schema → Claude function-calling tool format
- [ ] Each tool handler dispatches an orchestration command via `OrchestrationEngineService`
- [ ] Tool response format: compact JSON conforming to shared `DinocodeToolResult` schema
- [ ] Error handling: convert `OrchestrationDispatchCommandError` → Claude tool_result with `is_error: true`
- [ ] Unit tests in `ClaudeAdapter.test.ts`: each tool round-trips successfully

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
