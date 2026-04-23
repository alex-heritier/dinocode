---
# dinocode-r4ns
title: 'Browser: scaffold packages/dinocode-browser'
status: todo
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
