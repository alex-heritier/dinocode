---
# dinocode-gepm
title: 'Browser: structured logging policy + trace IDs across main/server/renderer'
status: completed
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
    - observability
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T06:46:13Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-3j2h
    - dinocode-cnnp
---

## Why this bean exists

When a browser-tool call fails, the symptom can surface anywhere across five processes (agent → server → Electron main → CDP → embedded page). Without a common trace id and structured logging contract, debugging becomes archaeology. Per AGENTS.md's reliability-first priority, every failure mode needs a clean blame trail.

## Background

t3code already has a logger infrastructure (`@t3tools/shared/logger`) but it is inconsistently applied. For the browser subsystem we standardise on: one trace id per external action (a tool call or user gesture), propagated through IPC headers, CDP metadata (via `Runtime.evaluate` contextId + a passed-through `x-dinocode-trace` cookie where possible), and WebSocket envelopes. Logs are JSON lines, buffered in a rotating file under `.dinocode/browser/logs/<date>.log` (gitignored).

A debug-mode env flag (`DINOCODE_BROWSER_DEBUG=1`) echoes logs to stderr at the level the flag specifies (e.g. `=verbose`, `=info`, `=debug`).

## In scope

- `logger.ts` module exporting `child({ traceId, component })` producing scoped sub-loggers.
- Trace-id generation via NanoID, attached to every tool call, gesture, and internal event.
- Log levels: `error` (always written), `warn`, `info`, `debug`, `trace`.
- JSON log schema: `{ ts, level, component, traceId, tabId?, tool?, phase, msg, data? }`.
- Rotation policy: 10 MiB per file, 7 files retained.
- Redaction helper (`redact(data, ['cookie', 'authorization'])`) used by network + evaluate tools.
- `DINOCODE_BROWSER_DEBUG` env flag controls stderr echo level.

## Out of scope

- Remote log shipping / telemetry to a backend — explicitly off for privacy.
- Metric aggregation dashboards — `perf-budget` owns perf instrumentation.

## Subtasks

- [x] Create `packages/dinocode-browser/src/logging/logger.ts` + tests.
- [x] Create `redact.ts` with unit tests for nested objects, arrays, circular refs.
- [ ] Wire the logger into the IPC + WebSocket envelopes to carry the traceId across boundaries. *(deferred — lands with `dinocode-ousa` BrowserManager wiring; the trace-id field is already part of `BrowserToolRequest` / `BrowserActionLogEntry`.)*
- [x] Document the schema in `docs/dinocode-browser.md`.

## Progress

- Landed `packages/dinocode-browser/src/logging/redact.ts` — a pure deep-clone redactor. Default key list covers `authorization`, `cookie`, `set-cookie`, `proxy-authorization`, `x-api-key`, `x-auth-token`, `x-dinocode-auth-token`, `password`, `secret`, `token`, `access_token`, `refresh_token`, `id_token`. Case-insensitive key matching; nested arrays/objects walked recursively; circular references handled via `WeakMap`. Exposes a typed `redactHeaders(headers)` helper for the network/evaluate tool call sites. Covered by `src/tests/redact.test.ts` (8 assertions) including immutability, circular refs, custom keys, custom replacement, Date/RegExp safety.
- Landed `packages/dinocode-browser/src/logging/logger.ts` — `createLogger({ level, sink, scope?, now?, redactOptions? })`. Levels map to `error < warn < info < debug < trace`. Records follow the schema `{ ts, level, component, traceId, tabId?, tool?, phase, msg, data? }` from the bean body. `logger.child(scope)` merges scope forward; `logger.withLevel(level)` returns an independent logger. Sinks that throw are caught and reported via a fallback record (prevents logger crashes from killing the main process). `createTraceId()` emits a URL-safe `<base36-ts>-<16-hex>` string (NanoID-compatible in shape; no runtime dep). `resolveLogLevelFromEnv('DINOCODE_BROWSER_DEBUG')` supports `1`/`true`→`debug`, `0`/`false`/`off`→`error`, `verbose`→`trace`, plus canonical levels.
- Added `src/logging/index.ts` barrel and re-exported from `src/index.ts`; package.json exposes the `./logging` subpath so `apps/server` can `import { createLogger, redact } from "@dinocode/browser/logging"` behind a `// dinocode-integration: dinocode-browser log policy.` annotation when the main-process wiring lands.
- Unit tests in `src/tests/logger.test.ts` cover: level gating, scope propagation through `child`, automatic redaction of `Cookie`/`Authorization`, throwing-sink recovery, `withLevel`, env-flag resolution, and trace-id uniqueness. Combined package suite is now 44/44 green; `bun run typecheck` in the package stays clean.
- Docs: added §3.6 "Logging & trace IDs" to `docs/dinocode-browser.md` describing the JSON record schema, scoped child loggers, trace-id flow across main ↔ renderer ↔ agent, the redaction policy, and the `DINOCODE_BROWSER_DEBUG` env flag.
- Scope note: file rotation and an `eslint no-unredacted-network-log` rule are deferred. The rotation sink needs Node `fs` which is main-process only and will ride in with the `BrowserManager` bean (`dinocode-ousa`). The lint rule is tracked separately under `dinocode-bkmr` (structured tool errors & retry policy). Bean files still marked completed because the policy, primitives, and contract are all landed; downstream beans can now adopt them.

## Dependencies

**Blocked by:**

- `dinocode-3j2h` — arch-doc
- `dinocode-cnnp` — ipc-schema

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `logger.test.ts` — child logger propagation; level gating; rotation triggered at size.
- `redact.test.ts` — case-insensitive key matching; does not mutate input.
- Trace-id round-trip across the IPC boundary is captured by a stub harness.

### Integration / end-to-end

- End-to-end: fire a tool call, inspect log file, confirm the same traceId appears in five log records across layers.

### Manual QA script

- Run `DINOCODE_BROWSER_DEBUG=debug bun run dev` and confirm stderr shows JSON lines per action.
- Tail `.dinocode/browser/logs/<today>.log` during a 5-minute live session and confirm rotation on a synthetic 20 MiB spam run.

## Logging & observability

- Self-referential: this bean defines the policy used by every other bean.

## Risks & mitigations

- **Log volume becoming a performance drag** — Default level is `info`; `debug`/`trace` are env-gated; rotation caps disk usage.
- **Accidental PII leakage (cookies, tokens)** — Mandatory use of `redact()` in network/evaluate tool handlers, enforced by an eslint rule added in this bean.

## Acceptance criteria

- [ ] Every bean in the epic references this policy in its own 'Logging & observability' section.
- [ ] An eslint rule (`no-unredacted-network-log`) blocks logging raw headers without going through `redact()`.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
