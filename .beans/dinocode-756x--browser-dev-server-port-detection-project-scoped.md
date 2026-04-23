---
# dinocode-756x
title: 'Browser: dev-server port detection (project-scoped)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-6-project
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-r4ns
---

Make "open the preview" zero-config for most project layouts.

## Scope

- Detectors (in priority order):
  1. `.dinocode/config.yml → browser.devServerUrl`.
  2. `package.json → dinocode.browser.devServerUrl`.
  3. Sniff `package.json` scripts for `vite`, `next dev`, `bun dev`, `astro dev`, `remix dev`, `rails server` and map to default ports.
  4. Scan running local processes for LISTEN sockets on 3000/3001/5173/4321/8080 and probe HTTP.
- Returns `{ url, confidence, source }`.
- Manual override field in project settings.

## Acceptance

- Detector works on a Vite React app with no config (5173 sniffed).
- Wrong guesses surface as "confidence: low" and require user confirm before auto-opening.


---

## Why this bean exists (epic context)

Zero-config 'Preview' works for most project layouts.

## Dependencies

**Blocked by:**

- `dinocode-r4ns`

**Blocks:**

- `dinocode-8xd5`
- `dinocode-jzfg`

**Related:**

- _None._

## Testing

### Unit tests

- Precedence order; sniffing; port-probe.

### Integration / end-to-end

- Vite / Next / Bun-dev / Astro fixtures each detected correctly.

### Manual QA

- Freshly-scaffolded Vite app; detected without config.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Wrong guesses confuse users** — Low-confidence sources require confirmation.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
