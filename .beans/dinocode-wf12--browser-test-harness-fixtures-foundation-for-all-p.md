---
# dinocode-wf12
title: 'Browser: test harness + fixtures (foundation for all phases)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
    - testing
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-r4ns
    - dinocode-gepm
---

## Why this bean exists

Every subsequent bean in the epic depends on a reliable way to spin up an isolated Electron main process, a `WebContentsView`, and a fake page with known console/network/DOM behaviour. Without a shared harness we'd end up with 30+ near-duplicate test setups, slow CI, and unreliable coverage. The harness is the single piece of infrastructure that makes the rest of the browser subsystem testable.

## Background

t3code's existing test story is Vitest with `@testing-library/react` for renderer code and plain Vitest for server/pure modules. There is no existing harness for Electron-main-process tests; the project runs a small smoke test via `apps/desktop/scripts/smoke-test.mjs` but that is not a reusable primitive.

We will introduce a new utility under `packages/dinocode-browser/src/testing/` that (a) launches Electron in headless mode via `spectron`-style child processes or the `electron-vitest` runner, (b) provides page fixtures served from a local HTTP server (the `fixtures/` directory ships canned pages with predictable console output, network behaviour, form layouts, and crash triggers), and (c) exposes a `withBrowser(fn)` helper that supplies a live `BrowserManager` plus a handle to the CDP adapter.

## In scope

- Harness API: `withBrowser({ partition?, fixtures? }, fn)` with auto-cleanup.
- Fixture HTTP server on a random port; serves deterministic pages for console, network, DOM, crash, form, auth, iframe, SW, WebSocket scenarios.
- A `FakePage` DSL for declaring expected events (e.g. `page.expectConsole({ level: 'error', text: /.+/ }).within(2000)`).
- Test-only tracing: dumps every CDP event, IPC call, and tool invocation with a trace id when the test fails.
- Golden-file helpers for accessibility-tree snapshots and screenshot diffs (pixelmatch with 0.2% threshold).
- `DINOCODE_BROWSER_TEST_DEBUG=1` env flag prints all logs even on success.

## Out of scope

- Running against a real Electron binary in CI — we do that in a later e2e bean (`e2e-phase1`); this harness is the in-process primitive.
- Benchmarking / perf regression automation (`perf-budget` bean covers that).

## Subtasks

- [ ] Scaffold `packages/dinocode-browser/src/testing/` with `harness.ts`, `fixtures/`, `fakePage.ts`, `golden.ts`.
- [ ] Build the fixture HTTP server (`tinyServer.ts`) — no external deps beyond Node's `http` module.
- [ ] Implement `withBrowser()` that yields `{ manager, tab, cdp, fixtures, trace }`.
- [ ] Implement `trace.flushOnFailure()` to print the collected trace when a test fails.
- [ ] Write 3 self-tests of the harness itself (one per fixture family) to prove it catches regressions.
- [ ] Document the harness in `packages/dinocode-browser/README.md`.

## Dependencies

**Blocked by:**

- `dinocode-r4ns` — pkg-scaffold
- `log-policy` (UNRESOLVED — fix before commit)

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `harness.test.ts` — `withBrowser` cleans up tabs + cdp on success and failure paths.
- `fakePage.test.ts` — `expectConsole` polling obeys timeouts.
- `golden.test.ts` — image diff reports correct pixel counts.

### Integration / end-to-end

- Loading the crash-trigger fixture and asserting the recovery UI states.
- Loading the console-fixture and asserting the ring buffer receives N entries.
- Loading the form fixture and asserting `fill_form` via the harness drives `onInput` exactly N times.

### Manual QA script

- `bun test packages/dinocode-browser/src/testing --reporter verbose` runs the harness self-tests in < 30s on a modern laptop.
- Introduce a deliberate regression (delete a CDP subscription) and verify the trace dump points to the missing event.

## Logging & observability

- Every harness step logs `{ traceId, step, ts, details }` to an in-memory ring buffer; flushed on failure.
- Log schema shared with `dinocode-log-policy` so traces stitch across harness + runtime.

## Risks & mitigations

- **Electron headless flakiness in CI** — Pin Electron version, share a single Electron process across tests, and serialise test ordering in the harness when needed.
- **Fixture server port collisions on shared CI runners** — Always bind to port 0 and read the assigned port back before launching the harness.

## Acceptance criteria

- [ ] `withBrowser()` usable from any other browser-subsystem test without additional setup.
- [ ] Self-tests demonstrate at least one success and one failure path for each fixture family.
- [ ] Readme has a worked example copied directly from a passing test.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
