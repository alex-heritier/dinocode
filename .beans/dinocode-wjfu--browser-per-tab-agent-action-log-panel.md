---
# dinocode-wjfu
title: "Browser: per-tab agent action log panel"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-87ah
  - dinocode-qb85
---

Auditable record of everything the agent did in a tab.

## Scope

- Collapsible panel at the bottom of each tab listing the last N agent actions: `{ ts, tool, argsSummary, resultSummary, durationMs, screenshotRefIfAny }`.
- Clickable rows expand to full params + result JSON.
- "Export session" → `.dinocode/browser/sessions/<tabId>-<ISO>.jsonl` (consumed by the recording bean).

## Acceptance

- Log persists for the life of the tab.
- Log size capped (1000 entries); older entries dropped with a marker.

---

## Why this bean exists (epic context)

Transparency + auditability. 'What did the agent just do?' answered at a glance.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-qb85`

**Blocks:**

- `dinocode-rfz5`

**Related:**

- _None._

## Testing

### Unit tests

- Row rendering; export format.

### Integration / end-to-end

- Run 10 agent tools; inspect log; export; reload project; export preserved until TTL.

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
