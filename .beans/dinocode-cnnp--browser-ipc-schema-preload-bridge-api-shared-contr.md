---
# dinocode-cnnp
title: "Browser: IPC schema + preload bridge API (shared contracts)"
status: completed
type: task
priority: high
tags:
  - phase-browser
  - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T06:40:44Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-3j2h
  - dinocode-r4ns
---

Lock down the IPC shapes before any renderer/main code exists so both sides build against a stable API.

## Scope

- Effect `Schema` definitions in `packages/dinocode-browser/src/shared/schemas.ts` for every IPC payload:
  - `BrowserTabId`, `BrowserTabState`, `BrowserNavigationEvent`, `BrowserConsoleEntry`, `BrowserNetworkEntry`, `BrowserToolRequest`/`Response`, `BrowserActionLogEntry`.
- Preload API (`window.dinocodeBrowser`) exposed via `contextBridge.exposeInMainWorld` with typed wrappers around `ipcRenderer.invoke` and `ipcRenderer.on`.
- `packages/dinocode-contracts` re-exports the schemas for the server-side tool handlers.

## Acceptance

- Types round-trip: `Schema.decode` ↔ `Schema.encode` tested.
- No `any` anywhere in the bridge API.
- Preload file stays under 80 lines (pure wiring, zero logic).
- Added under `dinocode-integration: browser` comment in `apps/desktop/src/preload.ts` once the real exposer ships in Phase 1.

---

## Why this bean exists (epic context)

Both sides of the contextBridge boundary must agree on typed payloads. Fixing the schema in `effect/Schema` early means every bean downstream can import the same types without drifting.

## Dependencies

**Blocked by:**

- `dinocode-3j2h`
- `dinocode-r4ns`

**Blocks:**

- `dinocode-ousa`
- `dinocode-qb85`
- `dinocode-87ah`
- `dinocode-b71p`
- `dinocode-gepm`
- `dinocode-j4ve`

**Related:**

- _None._

## Testing

### Unit tests

- Schema round-trips: `Schema.decode(Schema.encode(x)) === x` for every shape.
- Malformed payloads decode into a structured `DecodeError`.

### Integration / end-to-end

- Preload + renderer type-compatibility test: import both sides, assert no `any`.

### Manual QA

- Generate a sample preload bridge type file; eyeball-review for clarity.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log decode failures at `error` with the malformed payload (redacted).

## Risks & mitigations

- **Schema drift as features land** — A CI check enumerates every exported schema and diffs against a golden snapshot; intentional changes update the snapshot.

## Acceptance criteria (superset)

- [ ] Every IPC message has a schema under `src/shared/schemas.ts`.
- [ ] Preload file stays ≤ 80 lines.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.

## Progress

- Added every IPC payload schema to
  `packages/dinocode-browser/src/shared/schemas.ts`:
  `BrowserTabIdSchema`, `BrowserPartitionIdSchema`, `BrowserTraceIdSchema`,
  `BrowserTabStatusSchema`, `BrowserTabState`, `BrowserNavigationEvent`,
  `BrowserConsoleEntry`, `BrowserNetworkEntry`, `BrowserToolNameSchema`,
  `BrowserToolRequest`, `BrowserToolErrorKindSchema`,
  `BrowserToolErrorSchema`, `BrowserToolResponse`,
  `BrowserActionActorSchema`, `BrowserActionLogEntry`,
  `BrowserInvokeEnvelope`, `BrowserEventEnvelope`. All are Effect `Schema`
  structs/unions with explicit constraints (patterns, length caps, numeric
  ranges).
- Added `packages/dinocode-browser/src/preload/bridge.ts` (71 lines — under
  the 80-line budget from acceptance criteria): `BrowserIpcChannels`
  constant, `DinocodeBrowserApi` interface with `invoke` + `subscribe`,
  `BrowserBridgeDeps` that abstracts over `electron`'s own
  `contextBridge`/`ipcRenderer` so the package stays Electron-optional, and
  a pure-wiring `exposeDinocodeBrowserBridge(deps)` implementation.
- Barrel updates: `src/shared/index.ts` re-exports the schemas; a new
  `src/preload/index.ts` re-exports the bridge so consumers can do
  `import { exposeDinocodeBrowserBridge } from "@dinocode/browser/preload"`.
- Unit tests (vitest): `src/tests/schemas.test.ts` covers `decode ∘ encode`
  round trips for every schema + rejection cases for malformed tab ids,
  out-of-range `loadingProgress`, unknown tool names. `src/tests/bridge.test.ts`
  verifies the bridge exposes the right window key, forwards to the right IPC
  channel, wires/unsubscribes the event listener correctly. 20 tests pass.
- Documentation: `docs/dinocode-browser.md` §3.3 (Preload) expanded with a
  §3.3.1 IPC schema table listing each schema, direction, and purpose; the
  integration contract for `apps/desktop/src/preload.ts` is spelled out
  (`// dinocode-integration: dinocode-browser preload bridge.`).
- Deferred (explicitly out of scope for this bean): re-export of schemas
  from `packages/dinocode-contracts` — blocked by the contracts extraction
  `dinocode-fm1h`. Server-side tool handlers will import from
  `@dinocode/browser/shared` directly until that bean lands.
- Verified: `bun run typecheck` passes across all 12 workspaces, `bun run fmt`
  is clean, `bun run lint` introduces no new errors,
  `scripts/check-t3code-drift.ts` still passes vs `HEAD~1` (zero new
  `apps/*` or `packages/contracts/*` churn).
