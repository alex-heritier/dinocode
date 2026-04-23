---
# dinocode-sdqj
title: "Browser: navigation allowlist + confirm-on-unknown security model"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:33Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-3j2h
  - dinocode-cnnp
---

Define and implement the security boundary that protects users from an agent wandering to arbitrary origins.

## Policy

- **Default allowlist per workspace**: `localhost`, `127.0.0.1`, `::1`, `*.local`, plus any origins listed in `.dinocode/config.yml → browser.allowedOrigins`.
- **Agent-initiated navigation** outside the allowlist → tool returns `NAVIGATION_BLOCKED`; tab does not change.
- **User-initiated navigation** outside the allowlist → modal confirm "This project's agent has not been granted access to <origin>. Allow once / Always allow / Cancel".
- **Explicit deny-list** for common credential-phishing / third-party-auth origins users typically don't want the agent touching.
- Allowlist state persists per project under `.dinocode/browser/allowlist.json` (workspace-scoped, not user-global).

## Acceptance

- Pure logic module (`Allowlist.ts`) with exhaustive unit tests.
- Agent tool handlers wrap `navigate`/`open` in an allowlist check before calling into main.
- Settings UI (later bean) surfaces the allowlist for edit.

---

## Why this bean exists (epic context)

The allowlist is the single enforcement point for origin-safety. If we don't land this before any agent tool can navigate, we create a dangerous default.

## Dependencies

**Blocked by:**

- `dinocode-3j2h`
- `dinocode-cnnp`

**Blocks:**

- `dinocode-vkd6`
- `dinocode-6xeu`
- `dinocode-xtqg`
- `dinocode-w0qv`
- `dinocode-t2l9`
- `dinocode-lux5`

**Related:**

- _None._

## Testing

### Unit tests

- Default allowlist matrix: localhost/127.0.0.1/::1/\*.local accepted; other origins rejected.
- Override via `.dinocode/config.yml` honoured.
- Per-project persistence read/write/round-trip.
- Policy is pure — same input always yields same decision.

### Integration / end-to-end

- Agent navigate → denied origin → `NAVIGATION_BLOCKED` with hint.
- User navigate → denied origin → inline confirm UI; 'always allow' persists.

### Manual QA

- Add + remove origins via settings panel; verify persistence.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Every decision logged with `{ origin, initiator, decision, persisted }`.

## Risks & mitigations

- **User fatigue → 'always allow' habit** — Friction only on first visit per origin; clear scope in copy.

## Acceptance criteria (superset)

- [ ] Decision module is pure; no FS/network calls.
- [ ] Deny-list has a small default set of common credential-phishing origins.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
