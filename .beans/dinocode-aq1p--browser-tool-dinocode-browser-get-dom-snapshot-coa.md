---
# dinocode-aq1p
title: 'Browser tool: dinocode_browser_get_dom_snapshot (coarse, opt-in)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-yne5
    - dinocode-dyjh
---

Full DOM dump for deep debugging. Rarely used; opt-in because it's heavy.

## Scope

- `dinocode_browser_get_dom_snapshot({ tabId, includeStyles?: boolean, selector?: string })` → `{ html | artifact path }`.
- Prefer the accessibility tree in normal operation; this is for when the agent needs to see the raw HTML (e.g., diagnosing a hydration mismatch).
- If HTML > 200 KiB, writes to `.dinocode/browser/dom-snapshots/<tabId>/<ISO>.html` and returns a path.

## Acceptance

- Size threshold respected.
- Warning in tool description: "Prefer `get_accessibility_tree` unless you specifically need raw HTML".


---

## Why this bean exists (epic context)

Escape hatch for deep debugging — opt-in, size-capped.

## Dependencies

**Blocked by:**

- `dinocode-yne5`
- `dinocode-dyjh`

**Blocks:**

- _None._

**Related:**

- `dinocode-56ga`

## Testing

### Unit tests

- Size threshold routing to disk.

### Integration / end-to-end

- Snapshot a large page; verify path returned; HTML valid.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Users use this instead of a11y-tree and blow context budget** — Tool description explicitly warns.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
