---
# dinocode-yne5
title: "Browser tool: dinocode_browser_evaluate (JS eval + JSON result)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-87ah
  - dinocode-u1nj
---

The workhorse tool for debugging: run arbitrary JS in the active page's main world.

## Scope

- `dinocode_browser_evaluate({ tabId, expression, awaitPromise?: boolean, timeoutMs?: number, worldName?: 'main'|'isolated' })` → `{ value (JSON-safe), undefinedResult, error? }`.
- Uses `Runtime.evaluate` with `returnByValue: true`.
- Default 5s timeout, max 30s.
- Non-JSON-safe values returned as `{ __repr: '<Symbol>'  }` or similar sentinel.
- `awaitPromise` supports async functions.

## Acceptance

- Can evaluate DOM queries, localStorage reads, network-level fetches (`fetch().then(r => r.json())`).
- Syntax errors + runtime errors surface under `error: { name, message, stack }`.
- Hardened against mutating global scope accidentally (tool docs warn).

---

## Why this bean exists (epic context)

The workhorse JS-eval tool. Nearly everything agents do hangs off this.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-u1nj`

**Blocks:**

- `dinocode-cbcb`
- `dinocode-aq1p`
- `dinocode-8t74`

**Related:**

- `dinocode-56ga`

## Testing

### Unit tests

- Syntax error surfaces as structured `error`.
- Promise with `awaitPromise=true` resolves or times out.
- Non-JSON-safe values marshalled sentinel.

### Integration / end-to-end

- Eval `document.title`; assert equality.
- Eval `async () => fetch(...)`; assert typed result.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Redact expression if > N chars; keep digest.

## Risks & mitigations

- **User-content expressions leaking to logs** — Always log a digest, never raw.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
