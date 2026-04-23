---
# dinocode-6vwu
title: 'Browser: proxy + enterprise network config'
status: todo
type: task
priority: low
tags:
    - phase-browser
    - phase-7-later
    - security
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
---

## Why this bean exists

Some users operate behind corporate proxies with MITM certs. We accept the system proxy by default and expose per-project overrides.

## Background

`session.setProxy(config)` + OS env vars `HTTP_PROXY` / `HTTPS_PROXY`.

## In scope

- Inherit OS proxy.
- Per-project override via `.dinocode/config.yml → browser.proxy`.
- UI surface in settings.

## Out of scope

- PAC file editor.

## Subtasks

- [ ] Config + override + UI + tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Config precedence.

### Integration / end-to-end

- Launch against local fake proxy; assert requests routed.

### Manual QA script

- Behind real corp proxy if available.

## Logging & observability

- Log proxy resolution at startup.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Works behind a standard HTTP proxy.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
