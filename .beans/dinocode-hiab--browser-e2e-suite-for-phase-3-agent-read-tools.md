---
# dinocode-hiab
title: "Browser: e2e suite for Phase 3 (agent read tools)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-3-agent-read
  - testing
created_at: 2026-04-23T05:46:24Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-87ah
  - dinocode-w0qv
  - dinocode-t2l9
  - dinocode-yne5
  - dinocode-c3lk
  - dinocode-w19p
  - dinocode-56ga
  - dinocode-07j6
  - dinocode-7n6g
  - dinocode-wf12
---

## Why this bean exists

Every phase of the browser epic must ship with a runnable, deterministic end-to-end suite that exercises the phase's capability against real Electron + real CDP. Unit tests alone won't catch the integration problems that make the browser hard to debug.

## Background

Built on the test harness (`dinocode-test-harness`). Tests run in a headed-but-hidden Electron child process. Run via `bun run test:browser:e2e:<phase>`. Detailed logs are always preserved to `.dinocode/browser/logs/test-run-<id>/` and dumped to stderr on failure, per the logging policy.

## In scope

- Each tool callable from the harness with typed args.
- `evaluate` returns JSON; handles promises with timeout.
- `get_console` paginates correctly; `get_network` filters.
- `get_accessibility_tree` tree fits under 5 KiB for example.com.
- `screenshot` file exists, correct dimensions; full-page mode works.

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

- `dinocode-87ah` — tool-defs-module
- `dinocode-w0qv` — tool-open
- `dinocode-t2l9` — tool-navigate
- `dinocode-yne5` — tool-evaluate
- `dinocode-c3lk` — tool-get-console
- `dinocode-w19p` — tool-get-network
- `dinocode-56ga` — tool-a11y
- `dinocode-07j6` — tool-screenshot
- `dinocode-7n6g` — print-pdf
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
