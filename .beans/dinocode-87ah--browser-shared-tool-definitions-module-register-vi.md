---
# dinocode-87ah
title: 'Browser: shared tool definitions module + register via dinocode-agent-tools'
status: completed
type: task
priority: high
tags:
    - phase-browser
    - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T06:45:23Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-cnnp
    - dinocode-r4ns
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

---

## Why this bean exists (epic context)

Single source of truth for every browser agent-tool. Mirrors the pattern `dinocode-ndam` set for task tools.

## Dependencies

**Blocked by:**

- `dinocode-cnnp`
- `dinocode-r4ns`

**Blocks:**

- `dinocode-w0qv`
- `dinocode-t2l9`
- `dinocode-yne5`
- `dinocode-c3lk`
- `dinocode-w19p`
- `dinocode-56ga`
- `dinocode-07j6`
- `dinocode-cbcb`
- `dinocode-kww9`
- `dinocode-34kt`
- `dinocode-mexx`
- `dinocode-pyoi`
- `dinocode-aq1p`
- `dinocode-7n6g`
- `dinocode-te2e`
- `dinocode-wjfu`
- `dinocode-6os6`
- `dinocode-bkmr`
- `dinocode-1mfa`
- `dinocode-8t74`

**Related:**

- _None._

## Testing

### Unit tests

- Definition round-trip (to Codex/Claude/Cursor shapes and back).
- Each tool exports Schema inputs + outputs.

### Integration / end-to-end

- Adapter registers all tools at startup.

### Manual QA

- Check adapter surface from within a live session.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] Error envelope follows `DinocodeToolResult<T>` exactly.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.

## Progress

- Added `packages/dinocode-browser/src/tools/definitions.ts` with:
  - `DinocodeToolResult<T>` discriminated union (`{ ok: true, data } | { ok:
    false, code, message, hint? }`) matching the dinocode-ndam task-tool
    shape, plus a generic `DinocodeToolResultSchema(dataSchema)` combinator
    for contract tests and provider serialisation.
  - `DinocodeToolContext` — minimal handler context (`traceId`, optional
    `tabId`, `now()`, `invokeBrowser()` indirection). Designed so handlers
    are unit-testable with a fake browser in-process.
  - `DinocodeToolDefinition<Input, Output>` — the canonical `{ name,
    description, inputSchema, outputSchema, handler }` record.
  - `BROWSER_TOOL_DEFINITIONS` — the 20-tool catalogue keyed off
    `BrowserToolNameSchema.literals` so adding/removing a tool in the shared
    schema forces an entry here. Every tool gets a placeholder
    `notImplementedResult` handler; downstream beans replace them.
- Added `packages/dinocode-browser/src/tools/adapters.ts` with:
  - `toCodexTool`, `toClaudeTool`, `toCursorTool` producing the three
    provider-native JSON-tool shapes, driven by `Schema.toJsonSchemaDocument`.
  - `toAllProviderShapes` bundles all three for test and bulk-registration
    ergonomics.
  - Adapters read through a narrow structural `AnyDef` type so variance in
    per-tool `Input`/`Output` schemas does not poison the catalogue.
- Barrel `src/tools/index.ts` now re-exports both files.
- Unit tests (`src/tests/tools.test.ts`, 9 new tests):
  - Definition/catalogue parity with `BrowserToolNameSchema` literals.
  - Non-empty descriptions for every tool.
  - Placeholder handlers return the structured not-implemented envelope.
  - `DinocodeToolResultSchema` round-trips both ok and error branches.
  - Codex/Claude/Cursor shapes produced for every definition, round-tripping
    name + description across all three adapter forms.
- Totals: 29 tests pass in `@dinocode/browser`; root `bun run typecheck`
  clean across 12 workspaces; `bun run fmt` clean; `bun run lint` introduces
  no new errors.
- Deferred (explicit, called out here so reviewers don't expect it):
  - Registering `BROWSER_TOOL_DEFINITIONS` through the server's
    agent-tools adapter requires `dinocode-ndam` (task-tool registration) to
    land first so the two share one registration path; this bean provides
    the surface the registration needs.
  - Replacing placeholder `inputSchema`/`outputSchema`/`handler` for each
    tool happens in the per-tool beans (`dinocode-t2l9`, `dinocode-kww9`,
    etc.). Those beans now depend only on editing the existing catalogue
    entry instead of inventing the surface.
