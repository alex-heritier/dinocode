---
# dinocode-56ga
title: 'Browser tool: dinocode_browser_get_accessibility_tree (semantic snapshot)'
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

The primary structural snapshot tool for the agent — accessibility trees are orders of magnitude cheaper than raw DOM and semantically richer.

## Scope

- `dinocode_browser_get_accessibility_tree({ tabId, selector?: string, maxDepth?: number })` → `{ tree: AxNode }`.
- Uses `Accessibility.getFullAXTree` (or `getAXNodeAndAncestors` for scoped).
- Nodes include `{ role, name, value, description, focusable, focused, children, refId }`.
- `refId` is a stable opaque handle the agent can feed to `click`/`type` (like Playwright snapshots).
- Snapshot cache invalidates on DOM mutation; agent receives a fresh tree for structural actions.

## Acceptance

- Tree for https://example.com fits in <5KB JSON.
- Refs resolve successfully in interaction tools (Phase 4).
- Unit tests for tree normalization.


---

## Why this bean exists (epic context)

The token-efficient structural snapshot preferred over raw DOM.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-u1nj`

**Blocks:**

- `dinocode-cbcb`

**Related:**

- _None._

## Testing

### Unit tests

- Tree serialisation; refId stability.

### Integration / end-to-end

- Fetch tree for known page; match golden snapshot.

### Manual QA

- _None._

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **`AXTree` missing on some frames** — Fallback: walk frames via `Target` and assemble per-frame trees.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
