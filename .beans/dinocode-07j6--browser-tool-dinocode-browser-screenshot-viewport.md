---
# dinocode-07j6
title: "Browser tool: dinocode_browser_screenshot (viewport / full-page → artifact path)"
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
  - dinocode-dyjh
---

Capture screenshots for the agent and for session recordings.

## Scope

- `dinocode_browser_screenshot({ tabId, mode?: 'viewport'|'fullPage', selector?: string, format?: 'png'|'jpeg', quality?: number })` → `{ path, width, height, bytes }`.
- Uses `Page.captureScreenshot` with `captureBeyondViewport: true` for full-page.
- Saves to `.dinocode/browser/screenshots/<tabId>/<ISO>.png`; returns repo-relative path.
- Never inlines bytes — path-only response (with a length count).

## Acceptance

- Full-page screenshot of a scrollable doc fits in a single PNG (within Chromium's max image size).
- Selector-scoped screenshots clip to `getBoundingClientRect`.
- Artifact directory respects `.gitignore` (added under `.dinocode/browser/**`).

---

## Why this bean exists (epic context)

Visual artifact tool. Paths-only response keeps token usage sane.

## Dependencies

**Blocked by:**

- `dinocode-87ah`
- `dinocode-u1nj`
- `dinocode-dyjh`

**Blocks:**

- `dinocode-rfz5`
- `dinocode-8t74`

**Related:**

- `dinocode-7n6g`

## Testing

### Unit tests

- Filename generation; selector scoping.

### Integration / end-to-end

- Viewport + full-page + selector screenshots; path exists and opens as a valid PNG.

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
