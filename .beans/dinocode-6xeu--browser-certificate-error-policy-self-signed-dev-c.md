---
# dinocode-6xeu
title: 'Browser: certificate error policy (self-signed dev certs)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
    - security
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-sdqj
---

## Why this bean exists

Dev servers routinely use self-signed certificates (HTTPS on localhost). Without a policy the browser blocks them silently, confusing users and agents alike. We accept localhost self-signed certs by default and gate everything else on user confirmation.

## Background

Electron exposes `app.on('certificate-error', ...)`. Policy: localhost / 127.0.0.1 / `::1` / `*.local` self-signed → auto-accept (log); all other bad certs → inline UI 'Connection is not private' with 'Proceed anyway' behind a confirm. Agent navigation to a cert-error origin always returns `NAVIGATION_BLOCKED` regardless of policy.

## In scope

- `certificate-error` handler in main.
- Per-origin 'proceed anyway' memory (not persisted across restarts).
- Inline UI.
- Agent path always hard-denies with `NAVIGATION_BLOCKED`.

## Out of scope

- Custom CA trust store management.

## Subtasks

- [ ] Implement handler + policy.
- [ ] Inline UI.
- [ ] Tests with local HTTPS fixture using a self-signed cert.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-sdqj` — allowlist

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `certPolicy.test.ts` — matrix of (host, cert-type, initiator) → decision.

### Integration / end-to-end

- Launch fixture server with self-signed cert on `https://localhost:PORT`; navigate; assert auto-accept.
- Same fixture bound to `https://127.1.1.1:PORT`; assert user-confirm flow.

### Manual QA script

- Visit a known mis-cert public page; assert the warning UI; 'Proceed' works.

## Logging & observability

- Log every certificate-error `{ traceId, host, errorCode, decision, source }`.

## Risks & mitigations

- **Users habituated to auto-accepting** — Only localhost + .local get auto-accept; everything else forces an explicit click.

## Acceptance criteria

- [ ] Dev with self-signed localhost cert 'just works'; unknown hosts require explicit user proceed.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
