---
# dinocode-b71p
title: 'Browser: alert / confirm / prompt / beforeunload handling'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-cnnp
---

## Why this bean exists

`window.alert` et al. block the renderer until dismissed. Electron surfaces these through native OS dialogs by default, which breaks agent tooling (no way to dismiss programmatically) and is visually jarring in the embedded panel. We show in-panel replacements for users and auto-dismiss with configurable behaviour for agents.

## Background

Intercept via `webContents.on('-dialog-*')` (Electron internal) or install a preload that monkey-patches `alert`/`confirm`/`prompt` in the embedded page's main world. We go with the preload approach for consistency across same-origin frames; out-of-origin iframes are documented as using native.

## In scope

- In-panel replacement UI (non-blocking during agent drives).
- Agent-facing policy: `confirm` default returns true, `prompt` returns the default value, `alert` is swallowed; overridable per-call via `dinocode_browser_handle_dialog` tool (queues the next response).
- `beforeunload` policy: on tab close, show in-panel prompt rather than native.

## Out of scope

- HTTP basic-auth dialogs (browser-native; covered by `login` event handler in a followup).

## Subtasks

- [ ] Preload script injection.
- [ ] Dialog queue state machine.
- [ ] Agent tool `dinocode_browser_handle_dialog`.
- [ ] Tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-cnnp` — ipc-schema

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Dialog queue state machine tests.

### Integration / end-to-end

- Fixture page triggers alert/confirm/prompt; agent drives without human intervention; each dismissed correctly.

### Manual QA script

- Trigger `alert('hi')` in DevTools console; confirm in-panel replacement shows and dismisses.

## Logging & observability

- Log each dialog `{ traceId, tabId, type, message, decision, source }`.

## Risks & mitigations

- **beforeunload suppressed by accident loses user work** — Explicit allowlist for when we auto-accept vs confirm.

## Acceptance criteria

- [ ] No native dialogs ever appear from embedded pages during normal operation.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
