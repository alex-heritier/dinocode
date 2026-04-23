---
# dinocode-ctrl
title: 'Browser: per-project session partition (cookies/storage isolation)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
---

Prevent cross-project cookie/localStorage/cache leakage.

## Scope

- Each project gets a persistent Electron partition: `persist:dinocode-project:<projectId>`.
- A "Clear browser data for this project" action in the browser settings drawer.
- A test that logs into a fake service in project A, switches to project B, verifies not logged in.

## Acceptance

- Cookies, localStorage, IndexedDB, and service workers all isolated per project.
- Switching projects does not require reopening tabs.
- Manual QA script documented in `docs/dinocode-browser.md`.


---

## Why this bean exists (epic context)

Per-project partitions are the privacy + isolation cornerstone. Without them, authenticated sessions leak across projects.

## Dependencies

**Blocked by:**

- `dinocode-ousa`

**Blocks:**

- `dinocode-lux5`
- `dinocode-yqtt`

**Related:**

- `dinocode-vkd6`

## Testing

### Unit tests

- Partition-naming scheme; session reuse across tabs in same project.

### Integration / end-to-end

- Login in project A; switch to project B; not logged in.
- Clear browser data per project; cookies gone; other projects unaffected.

### Manual QA

- Manual cookie inspection via DevTools in each partition.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log partition creation + destruction.

## Risks & mitigations

- **Partition explosion on many projects** — Garbage-collect partitions for deleted projects at startup.

## Acceptance criteria (superset)

- [ ] Partitions isolated across cookies, localStorage, IndexedDB, service workers, cache.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
