---
# dinocode-2x6y
title: Register built-in dinocode tools in Codex adapter
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:15:13Z
updated_at: 2026-04-22T07:36:04Z
parent: dinocode-lhp0
---

Register the dinocode built-in tools in the Codex provider adapter using the shared tool definition module.

## Subtasks

- [ ] Import shared tool definitions from `apps/server/src/dinocodeTools/definitions.ts`
- [ ] In `CodexAdapter.ts`, extend tool registration (Codex uses JSON-RPC `tools/list` + `tools/call` over stdio)
- [ ] Gate registration on `.dinocode/` being initialized for the session's project
- [ ] Map shared schema → Codex tool descriptor shape
- [ ] Handler invokes `OrchestrationEngineService.dispatch` and awaits committed event
- [ ] Shape `CallToolResult.content` per Codex contract (text content with JSON-encoded result)
- [ ] Unit tests in `CodexAdapter.test.ts`
