---
# dinocode-756x
title: "Browser: dev-server port detection (project-scoped)"
status: completed
type: task
priority: normal
tags:
  - phase-browser
  - phase-6-project
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-r4ns
---

Make "open the preview" zero-config for most project layouts.

## Scope

- Detectors (in priority order):
  1. `.dinocode/config.yml → browser.devServerUrl`.
  2. `package.json → dinocode.browser.devServerUrl`.
  3. Sniff `package.json` scripts for `vite`, `next dev`, `bun dev`, `astro dev`, `remix dev`, `rails server` and map to default ports.
  4. Scan running local processes for LISTEN sockets on 3000/3001/5173/4321/8080 and probe HTTP.
- Returns `{ url, confidence, source }`.
- Manual override field in project settings.

## Acceptance

- Detector works on a Vite React app with no config (5173 sniffed).
- Wrong guesses surface as "confidence: low" and require user confirm before auto-opening.

## Progress

- Landed `packages/dinocode-browser/src/devserver/DevServerDetector.ts` — pure pipeline `detectDevServer({ workspaceConfig, packageJson, listeningSockets? }) → ReadonlyArray<DevServerCandidate>`. The first candidate is the preferred one; the rest are kept so the UI can offer "other detected servers" when the user overrides.
- Confidence ladder matches the bean's intent: `configured` (workspace config) → `declared` (`package.json.dinocode.browser.devServerUrl`) → `sniffed` (matched a known dev-script) → `probed` (observed LISTEN socket on a known dev port) → `guess` (fallback to `localhost:3000`). `isAutoOpenSafe(candidate)` returns true only for the first three — `probed` and `guess` require a confirmation, matching "Wrong guesses surface as low-confidence".
- `SCRIPT_RULES` maps the common dev-runners to their default ports: `vite` → 5173, `next dev` → 3000, `bun dev` / `bun run dev` → 3000, `astro dev` → 4321, `remix dev` → 3000, `rails server` → 3000, plus a `tsx ... start` rule for TanStack Start. Each rule honours an explicit `--port` / `-p` override in the script body, so `"dev": "vite --port 4000"` correctly detects port 4000.
- `sniffScripts()` prefers a `dev` script, then `start`, then any other match — so a project that runs `"dev": "vite"` alongside `"docs": "astro dev"` gets `localhost:5173` as the headline candidate while keeping `localhost:4321` available as an alternative.
- Socket probe is passed in, not performed: the detector takes a `listeningSockets: { port, host }[]` snapshot and adds a `probed` candidate only when the port matches `KNOWN_DEV_PORTS` and hasn't already been surfaced by sniffing. This keeps the module free of Node APIs so the renderer and tests can use it directly; the main-process service owns the real probe.
- Validation: URLs are normalised through `new URL(...)` and required to be `http(s)`; invalid entries are silently dropped (the next detector runs). Unknown socket ports are ignored.
- Tests: `src/tests/devServerDetector.test.ts` (20 assertions) covers precedence order, explicit-port overrides for vite/next/astro, `bun run dev`, rails with custom port, `isAutoOpenSafe` booleans, probe-only detection, de-dup when sniff + probe agree, and the 3000 fallback. Full package suite is 106/106 green.
- Package exports: new `@dinocode/browser/devserver` subpath plus root re-export. The integration contract for the preview button is "read `.dinocode/config.yml` + `package.json`, call `detectDevServer(...)`, auto-open if `isAutoOpenSafe(result[0])`" with a `// dinocode-integration: dinocode-browser preview button detector` annotation.

---

## Why this bean exists (epic context)

Zero-config 'Preview' works for most project layouts.

## Dependencies

**Blocked by:**

- `dinocode-r4ns`

**Blocks:**

- `dinocode-8xd5`
- `dinocode-jzfg`

**Related:**

- _None._

## Testing

### Unit tests

- Precedence order; sniffing; port-probe.

### Integration / end-to-end

- Vite / Next / Bun-dev / Astro fixtures each detected correctly.

### Manual QA

- Freshly-scaffolded Vite app; detected without config.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Wrong guesses confuse users** — Low-confidence sources require confirmation.

## Acceptance criteria (superset)

- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
