---
# dinocode-cfbt
title: 'Browser: e2e suite for Phase 1 (embedded view MVP)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
    - testing
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-qb85
    - dinocode-49oz
    - dinocode-tb6r
    - dinocode-oxax
    - dinocode-2g71
    - dinocode-bs50
    - dinocode-crea
    - dinocode-ctrl
    - dinocode-2lh1
    - dinocode-fgw7
    - dinocode-vkd6
    - dinocode-6xeu
    - dinocode-xtqg
    - dinocode-b71p
    - dinocode-7bew
    - dinocode-er1u
    - dinocode-ybmy
    - dinocode-aikp
    - dinocode-7n6g
    - dinocode-yqtt
    - dinocode-m570
    - dinocode-g5pr
    - dinocode-2rrs
    - dinocode-u2p2
    - dinocode-wf12
---

## Why this bean exists

Every phase of the browser epic must ship with a runnable, deterministic end-to-end suite that exercises the phase's capability against real Electron + real CDP. Unit tests alone won't catch the integration problems that make the browser hard to debug.

## Background

Built on the test harness (`dinocode-test-harness`). Tests run in a headed-but-hidden Electron child process. Run via `bun run test:browser:e2e:<phase>`. Detailed logs are always preserved to `.dinocode/browser/logs/test-run-<id>/` and dumped to stderr on failure, per the logging policy.

## In scope

- Open app; navigate to a localhost fixture; verify panel renders; bounds sync on resize.
- Open DevTools; close DevTools; our CDP stays attached (assert via `evaluate` round-trip).
- Force a crashed renderer; 'Reload tab' recovers.
- Open 6 tabs; reordering persists; try to open 7th → `TOO_MANY_TABS`.
- Face toggle shortcut → navigates between chat and browser faces.
- Restart the app; tabs restore with their URLs + zoom.
- Project A cookie does not leak into project B (partition isolation).

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

- `dinocode-ousa` — browser-manager
- `dinocode-qb85` — panel-skeleton
- `dinocode-49oz` — address-bar
- `dinocode-tb6r` — devtools-toggle
- `dinocode-oxax` — crash-recovery
- `dinocode-2g71` — face-toggle
- `dinocode-bs50` — multi-tab
- `dinocode-crea` — persist-tabs
- `dinocode-ctrl` — session-partition
- `dinocode-2lh1` — downloads
- `dinocode-fgw7` — upload-picker
- `dinocode-vkd6` — permissions-handler
- `dinocode-6xeu` — cert-errors
- `dinocode-xtqg` — popup-handler
- `dinocode-b71p` — native-dialogs
- `dinocode-7bew` — find-in-page
- `dinocode-er1u` — zoom-controls
- `dinocode-ybmy` — audio-mute
- `dinocode-aikp` — ua-viewport
- `dinocode-7n6g` — print-pdf
- `dinocode-yqtt` — shutdown-quit
- `dinocode-m570` — error-boundary
- `dinocode-g5pr` — tab-discard
- `dinocode-2rrs` — a11y-ui
- `dinocode-u2p2` — keybinding-scope
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
