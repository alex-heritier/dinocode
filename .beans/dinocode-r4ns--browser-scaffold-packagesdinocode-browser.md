---
# dinocode-r4ns
title: "Browser: scaffold packages/dinocode-browser"
status: completed
type: task
priority: high
tags:
  - phase-browser
  - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T06:34:03Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-3j2h
---

Create the standalone package so all browser code has a home from day one.

## Layout

```
packages/dinocode-browser/
  README.md
  package.json            # @dinocode/browser, workspace:*
  tsconfig.json
  src/
    index.ts              # public barrel
    main/                 # runs in Electron main
    preload/              # contextBridge exposer
    renderer/             # React components + hooks
    shared/               # schemas/types shared across boundaries
    tools/                # agent-tool definitions + handlers
    tests/
```

## Acceptance

- `bun install` succeeds; `bun typecheck` green for the empty package.
- `README.md` explains the package's responsibilities + integration points.
- No imports from `apps/**` or `@t3tools/*` internals; may depend on `@dinocode/contracts`, `effect`, `electron` (peer), `react` (peer).
- Added to `docs/dinocode-packages.md` planned-packages table.

---

## Why this bean exists (epic context)

Creating the package up-front gives every subsequent bean a place to land code. Without this, early work drifts into `apps/web` and we violate the standalone-package rule.

## Dependencies

**Blocked by:**

- `dinocode-3j2h`

**Blocks:**

- `dinocode-ousa`
- `dinocode-wf12`
- `dinocode-gepm`
- `dinocode-cnnp`
- `dinocode-yaan`
- `dinocode-jtbw`
- `dinocode-dyjh`
- `dinocode-756x`

**Related:**

- _None._

## Testing

### Unit tests

- Empty-package typecheck passes.
- `bun run build` succeeds on the scaffold.

### Integration / end-to-end

- Importing `@dinocode/browser` from `apps/server` only exports the barrel (no internals).

### Manual QA

- Manual code-review of `package.json` + `tsconfig.json`.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- _None beyond those captured in the epic._

## Acceptance criteria (superset)

- [ ] Entry in `docs/dinocode-packages.md` Planned table.
- [ ] `src/index.ts` re-exports only the public API.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.

## Progress

- Scaffolded `packages/dinocode-browser` with `package.json` (`@dinocode/browser`,
  peer deps on `electron` + `react` + `react-dom`, `effect` as the only hard
  dep), `tsconfig.json` extending the base config with `lib: [ESNext, DOM,
DOM.Iterable]`, and the canonical `src/{main,preload,renderer,shared,tools,
tests}` layout.
- Barrel `src/index.ts` re-exports only `./shared` so renderer/main/preload
  subpath imports are the only way to reach process-specific code.
- `src/shared/{ids,errors}.ts` define the branded identifier types (`TabId`,
  `CdpSessionId`, `BrowserPartitionId`, `BufferCursor`) and the structured
  `BrowserError` taxonomy that downstream beans will import.
- Placeholder `src/{main,preload,renderer,tools}/index.ts` declare the
  subpath surface area so follow-on beans (dinocode-ousa, dinocode-u1nj,
  dinocode-cnnp, dinocode-qb85, browser tool beans) have a home for code.
- `src/tests/scaffold.test.ts` exercises the shared scaffolding (3 tests pass
  under `bun run test` in the package).
- `README.md` documents responsibilities, integration points, allowed vs
  forbidden deps, and cross-links `docs/dinocode-browser.md` and the package
  policy doc.
- `docs/dinocode-packages.md` "Existing" table now lists
  `packages/dinocode-browser` alongside `packages/soil`.
- Verified: `bun install` clean, `bun run typecheck` passes across all 12
  workspaces, `bun run fmt && bun run lint` introduce no new errors,
  `scripts/check-t3code-drift.ts` passes vs `HEAD~1`.
