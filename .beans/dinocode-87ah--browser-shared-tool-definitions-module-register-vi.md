---
# dinocode-87ah
title: 'Browser: shared tool definitions module + register via dinocode-agent-tools'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

All browser agent tools live in `packages/dinocode-browser/src/tools/` and are registered via the same plumbing as the task tools (dinocode-ndam).

## Scope

- Export `BROWSER_TOOL_DEFINITIONS: ToolDefinition[]` with `{ name, description, inputSchema (effect/Schema), outputSchema, handler }`.
- Handlers run on the server; they talk to main over the existing `desktopBridge` + a new `browser.*` IPC group.
- Each handler wraps errors in the unified `DinocodeToolResult<T>` shape: `{ ok: true, data } | { ok: false, code, message, hint? }` (same taxonomy as dinocode-ndam).
- Register the module when the agent-tools adapter initializes.

## Acceptance

- Codex + Claude + Cursor adapters all see the browser tools from a single source of truth.
- Adapter round-trip test (definition → adapter shape → back) passes.
