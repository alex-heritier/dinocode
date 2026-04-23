---
# dinocode-rfz5
title: "Browser: session recording + replay"
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
  - dinocode-yn5x
  - dinocode-ive4
  - dinocode-07j6
  - dinocode-wjfu
  - dinocode-dyjh
---

Record an agent's session (or a user's debugging session) so it can be replayed and embedded in a task.

## Scope

- Start/stop recording from the panel or via `dinocode_browser_record({ tabId, action: 'start'|'stop' })`.
- Recording captures: every action (agent + user), DOM snapshots every N seconds, console + network deltas, screenshots on significant events.
- Stored as `.dinocode/browser/sessions/<tabId>-<ISO>/` with `manifest.json` + per-event files.
- Replayer renders the session as an interactive timeline (out of scope for this bean beyond storage format; replayer viewer is a follow-up).

## Acceptance

- Format documented in `docs/dinocode-browser.md`.
- Size-capped to 200 MiB per session with graceful stop-on-cap.

---

## Why this bean exists (epic context)

Bundles a full debug session into a replayable artifact.

## Dependencies

**Blocked by:**

- `dinocode-yn5x`
- `dinocode-ive4`
- `dinocode-07j6`
- `dinocode-wjfu`
- `dinocode-dyjh`

**Blocks:**

- `dinocode-1mfa`

**Related:**

- _None._

## Testing

### Unit tests

- Manifest format; size cap; stop-on-cap.

### Integration / end-to-end

- Record 30-second session; manifest + assets present; replayable.

### Manual QA

- Actual recording session; verify size bound.

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
