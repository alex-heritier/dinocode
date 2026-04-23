---
# dinocode-bkmr
title: "Browser: structured tool errors + retry policy docs"
status: completed
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
---

Tight error taxonomy so agents can self-correct.

## Scope

- Error codes canonicalized in `packages/dinocode-browser/src/shared/errors.ts`:
  - `NAVIGATION_BLOCKED` — allowlist.
  - `TAB_CRASHED` — renderer gone.
  - `LOAD_FAILED` — HTTP/network error.
  - `EVALUATE_ERROR` — JS threw.
  - `TIMEOUT` — waiter expired.
  - `NOT_FOUND` — selector / tabId absent.
  - `NOT_INTERACTABLE` — element offscreen/disabled/detached.
  - `USER_ACTIVE` — user currently interacting.
  - `PERMISSION_DENIED` — user revoked agent control.
  - `TOO_MANY_TABS` — cap reached.
  - `INTERNAL` — unknown.
- Each error carries a structured `hint` the agent can use.
- `docs/dinocode-browser.md` has a "Retry-safe vs. fatal" table.

## Acceptance

- Every tool exits through the canonical error path (no raw `throw` escapes).
- Contract test enumerates each error code.

## Progress

- `packages/dinocode-browser/src/shared/errors.ts` rewritten to own the canonical taxonomy. `BROWSER_ERROR_KINDS` is the authoritative tuple (`NavigationBlocked`, `TabCrashed`, `LoadFailed`, `EvaluateError`, `Timeout`, `NotFound`, `NotInteractable`, `UserActive`, `PermissionDenied`, `TooManyTabs`, `BufferOverflow`, `RateLimited`, `CdpDetached`, `Internal`) — PascalCase on the wire for TS idiom, 1:1 with the bean's canonical list plus the infrastructure-only codes (`BufferOverflow`, `RateLimited`, `CdpDetached`) that agents also need to disambiguate.
- Added `BROWSER_ERROR_RETRY_POLICY` table classifying each kind as `retryable` or `fatal`, and `BROWSER_ERROR_DEFAULT_HINTS` mapping each to a short, agent-targeted next-step string. `BrowserError(kind, message)` now auto-populates `retryable` from the policy and `hint` from the defaults, while still letting call sites override either.
- `BrowserToolErrorKindSchema` in `shared/schemas.ts` was re-aligned to the same literal set, and `BrowserToolErrorSchema` gained an optional `hint` field (max 512). Round-trip tests keep `RateLimited`/`NavigationBlocked` green; the new `errors.test.ts` (7 assertions) asserts runtime↔wire parity and that every hint fits under the schema's length cap.
- Updated `src/tests/scaffold.test.ts` to use the new kinds (`NotFound`, `Timeout`) and to verify the canonical retry default is applied.
- Docs: added `docs/dinocode-browser.md` §3.5 "Error taxonomy & retry policy" with the full retry/fatal table and authoritative hint summaries. The §3.6 logging section written under `dinocode-gepm` now links into it when describing how errors flow through the log.
- Not yet in scope: wiring tool handlers to the 250ms-backoff retry loop — that lands with the individual handler beans (`dinocode-t2l9` etc.). The schema contract and authoritative policy are in place so each handler can drop into place without debating codes.

---

## Why this bean exists (epic context)

Stable error codes let agents self-correct without human intervention.

## Dependencies

**Blocked by:**

- `dinocode-87ah`

**Blocks:**

- _None._

**Related:**

- `dinocode-te2e`

## Testing

### Unit tests

- Every tool asserted to route through canonical codes.

### Integration / end-to-end

- Synthesise each code; assert hint quality.

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
