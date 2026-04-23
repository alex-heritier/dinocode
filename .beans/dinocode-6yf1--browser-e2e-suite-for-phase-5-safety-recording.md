---
# dinocode-6yf1
title: 'Browser: e2e suite for Phase 5 (safety + recording)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-5-safety
    - testing
created_at: 2026-04-23T05:46:24Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-6os6
    - dinocode-wjfu
    - dinocode-bkmr
    - dinocode-rfz5
    - dinocode-dyjh
    - dinocode-lux5
    - dinocode-wf12
---

## Why this bean exists

Every phase of the browser epic must ship with a runnable, deterministic end-to-end suite that exercises the phase's capability against real Electron + real CDP. Unit tests alone won't catch the integration problems that make the browser hard to debug.

## Background

Built on the test harness (`dinocode-test-harness`). Tests run in a headed-but-hidden Electron child process. Run via `bun run test:browser:e2e:<phase>`. Detailed logs are always preserved to `.dinocode/browser/logs/test-run-<id>/` and dumped to stderr on failure, per the logging policy.

## In scope

- Driving banner appears during interaction tools; 'Take over' disables agent.
- Action log records every tool call + result with trace id; export works.
- Error taxonomy: synthesise each code; assert structured hint.
- Session recording: start/stop; manifest contains events; replayable via schema.
- Artifact storage: every path gitignored.

## Out of scope

- Tests belonging to later phases (each phase has its own e2e bean).
- Perf / regression tests (`perf-budget` covers those).

## Subtasks

- [ ] Write a fixture per capability.
- [ ] Write a test per capability.
- [ ] Wire into `turbo.jsonc` / package scripts.
- [ ] Document running locally.

## Dependencies

**Blocked by:**

- `dinocode-6os6` — driving-banner
- `dinocode-wjfu` — action-log
- `dinocode-bkmr` — error-taxonomy
- `dinocode-rfz5` — session-recording
- `dinocode-dyjh` — artifact-storage
- `dinocode-lux5` — settings-panel
- `dinocode-wf12` — test-harness

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Fixtures themselves have sanity tests.

### Integration / end-to-end

- This bean _is_ the integration test bean.

### Manual QA script

- Run the suite locally; inspect the `.log.jsonl` dump for clarity.

## Logging & observability

- Every test emits a trace id; failing tests dump the full trace.
- Each tool call, CDP event, IPC call, and DOM mutation is logged.

## Risks & mitigations

- **CI flakiness from Electron headless** — Retry logic (at most 2x), per-test isolation, explicit teardown.

## Acceptance criteria

- [ ] Suite runs green on CI 10 consecutive times.
- [ ] Every failing log contains enough context to triage without re-running.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
