---
# dinocode-te2e
title: "Browser: agent rate limiting + per-tab quotas"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-4-agent-interact
  - safety
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-87ah
  - dinocode-6os6
---

## Why this bean exists

A misbehaving agent could hammer the browser (1000 clicks/sec) causing UI lag, CDP queue explosion, or DoS-ing the dev server. Quota caps protect the system and provide clear signals (tool returns `RATE_LIMITED`) so the agent can back off.

## Background

Token-bucket per (projectId, tabId, tool-family). Reasonable defaults: 30 interactions/minute, 300/minute total across tools.

## In scope

- Token buckets + config.
- `RATE_LIMITED` error with `retryAfterMs`.
- Shared with headless CLI mode.

## Out of scope

- Server-side rate limiting across users (we're single-user local).

## Subtasks

- [ ] Bucket module + tool wiring + tests.

## Dependencies

**Blocked by:**

- `dinocode-87ah` — tool-defs-module
- `dinocode-6os6` — driving-banner

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Bucket math; refill under jitter.

### Integration / end-to-end

- Fire 200 click tools in 1 second; assert later calls receive `RATE_LIMITED` with increasing retryAfterMs.

### Manual QA script

- Run an exaggerated agent loop; verify we don't freeze the UI.

## Logging & observability

- Log rate-limit events `{ traceId, tabId, tool, quotaRemaining }`.

## Risks & mitigations

- **False-positive blocks legit tool sequences** — Generous defaults; configurable via settings.

## Acceptance criteria

- [ ] System remains responsive under a 10x burst.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
