---
# dinocode-ucr3
title: Register built-in dinocode tools in Claude adapter
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:13Z
updated_at: 2026-04-22T07:36:04Z
parent: dinocode-lhp0
---

Register the dinocode built-in tools (list/view/create/update/link/unlink) in the Claude provider adapter using shared tool definitions.

## Subtasks

- [ ] Import shared tool definitions from `apps/server/src/dinocodeTools/definitions.ts` (see dinocode-yjt9)
- [ ] In `ClaudeAdapter.ts`, extend the tool registration to include dinocode tools when `.dinocode/` is initialized for the session's project
- [ ] Translate shared tool schema → Claude function-calling tool format
- [ ] Each tool handler dispatches an orchestration command via `OrchestrationEngineService`
- [ ] Tool response format: compact JSON conforming to shared `DinocodeToolResult` schema
- [ ] Error handling: convert `OrchestrationDispatchCommandError` → Claude tool_result with `is_error: true`
- [ ] Unit tests in `ClaudeAdapter.test.ts`: each tool round-trips successfully
