---
# dinocode-sdqj
title: "Browser: navigation allowlist + confirm-on-unknown security model"
status: completed
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

## Progress

- Landed `packages/dinocode-browser/src/security/Allowlist.ts` — a pure decision module. Exports `evaluateAllowlist({ url, initiator, policy }) → { decision: "allowed" | "denied" | "confirmRequired", reason?, matchedPattern?, host?, origin? }`. No FS, no network, no clock; same input always yields the same decision (asserted by test).
- Workspace defaults: `DEFAULT_WORKSPACE_ALLOWLIST` = `['localhost', '127.0.0.1', '::1', '*.local']`. `DEFAULT_DENYLIST` covers common credential-phishing / OAuth / SSO targets: `accounts.google.com`, `login.microsoftonline.com`, `login.live.com`, `github.com/login`, `github.com/sessions`, `appleid.apple.com`, `id.apple.com`, `auth0.com`, `*.okta.com`. `buildPolicy({ allowedOrigins?, deniedOrigins? })` merges the `.dinocode/config.yml` overrides on top.
- Pattern syntax is constrained on purpose: exact host, `*.` subdomain wildcard, or `host/path-prefix`. `parseHostPattern` throws on mid-label wildcards so settings UIs can surface the error. IPv6 literals are normalised by stripping `[...]` brackets.
- Deny beats allow — even if a user adds `accounts.google.com` to the allow-list, `evaluateAllowlist` still returns `denied` with `reason: "Denylisted"`. The path-prefix scoping means `github.com/login` is blocked while `github.com/alex/project` can be confirmed.
- Agents never see `confirmRequired` — agent-initiated navigation outside the allow-list returns `denied` with `reason: "NotInAllowlist"`, which tool handlers map to the `NavigationBlocked` browser error (`BROWSER_ERROR_DEFAULT_HINTS.NavigationBlocked` from `dinocode-bkmr`). User-initiated navigation gets `confirmRequired`, and the renderer is expected to show the standard "Allow once / Always allow / Cancel" modal; `addToAllowList` is the one-liner the "Always allow" path calls before persistence.
- Tests: `src/tests/allowlist.test.ts` covers (22 cases): pattern parser happy path + wildcard rejection, IPv6 normalisation, default-policy matrix for `localhost`, `127.0.0.1`, `::1`, `*.local`, unknown hosts (agent/user), deny-list including path-prefix and wildcard variants, deny-beats-allow, `buildPolicy` extension, `addToAllowList` idempotence, and purity. Full package suite is 72/72 green.
- Persistence (reading/writing `.dinocode/browser/allowlist.json`) is deferred — it lives in the main-process `BrowserManager` bean (`dinocode-ousa`) which owns the FS. The decision module already exposes `addToAllowList(policy, origin)` so the manager can thread the update through without any logic duplication.
- Package exports: new `@dinocode/browser/security` subpath and root re-export for convenience. Added `docs/dinocode-browser.md` §3.4 "Navigation allowlist & security model" with the decision matrix, pattern syntax, and the user-facing confirm copy.

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
