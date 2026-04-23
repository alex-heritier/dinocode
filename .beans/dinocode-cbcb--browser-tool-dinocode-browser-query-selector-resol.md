---
# dinocode-cbcb
title: "Browser tool: dinocode_browser_query_selector (resolve + describe)"
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
  - dinocode-yne5
  - dinocode-u1nj
  - dinocode-56ga
---

Find an element and describe it structurally; returns a stable ref usable by click/type/fill.

## Scope

- `dinocode_browser_query_selector({ tabId, selector (CSS or XPath), waitForMs?: number })` → `{ ref, role, text, box, visible, disabled }`.
- Under the hood, `Runtime.evaluate` + `DOM.resolveNode` → store a node-id-keyed handle.
- If not found after `waitForMs`, returns `NOT_FOUND` with the last polled count.

## Acceptance

- Works for common forms of selector (`#id`, `.class`, `button[aria-label="…"]`, XPath `//button[.="OK"]`).
- Returned `box` in viewport pixels.

---

## Why this bean exists (epic context)

Resolve-and-describe for downstream interaction tools.

## Dependencies

**Blocked by:**

- `dinocode-yne5`
- `dinocode-u1nj`
- `dinocode-56ga`

**Blocks:**

- `dinocode-kww9`
- `dinocode-34kt`
- `dinocode-mexx`
- `dinocode-pyoi`

**Related:**

- _None._

## Testing

### Unit tests

- CSS + XPath + aria combinations; waitForMs polling.

### Integration / end-to-end

- 40 fixture elements resolved stably.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
