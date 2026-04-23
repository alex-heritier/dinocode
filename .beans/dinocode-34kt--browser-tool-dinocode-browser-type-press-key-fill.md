---
# dinocode-34kt
title: "Browser tool: dinocode_browser_type / press_key / fill_form"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-cbcb
  - dinocode-yne5
---

Simulated keyboard input + high-level form fill.

## Scope

- `dinocode_browser_type({ tabId, ref | selector, text, replace?: boolean })` — typing sends real key events (`Input.dispatchKeyEvent`) so IMEs and oninput handlers behave correctly.
- `dinocode_browser_press_key({ tabId, key, modifiers? })` — single key (`Enter`, `Escape`, `ArrowDown`, `Meta+A`).
- `dinocode_browser_fill_form({ tabId, fields: [{ labelOrRef, value }] })` — high-level fill: resolves labels → inputs, types each.

## Acceptance

- Typing into a `<textarea>` with `onInput` handler triggers the handler for each keystroke.
- `press_key` supports common editor shortcuts.
- `fill_form` resolves by `<label for>`, `aria-labelledby`, or placeholder fallback.

---

## Why this bean exists (epic context)

Keyboard input via CDP — fires real key events.

## Dependencies

**Blocked by:**

- `dinocode-cbcb`
- `dinocode-yne5`

**Blocks:**

- `dinocode-6os6`

**Related:**

- `dinocode-fgw7`
- `dinocode-te2e`

## Testing

### Unit tests

- Modifier handling; replace flag behaviour.

### Integration / end-to-end

- Type into textarea; onInput fires per keystroke; final value matches.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Redact typed text; keep length + digest.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
