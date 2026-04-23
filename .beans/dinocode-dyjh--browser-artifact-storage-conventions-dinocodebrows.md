---
# dinocode-dyjh
title: "Browser: artifact storage conventions (.dinocode/browser/**)"
status: completed
type: task
priority: normal
tags:
  - phase-browser
  - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-r4ns
---

One place, one layout, `.gitignore`'d, and user-discoverable.

## Scope

- Directory layout:
  - `.dinocode/browser/screenshots/<tabId>/<ISO>.png`
  - `.dinocode/browser/network-bodies/<tabId>/<requestId>.<ext>`
  - `.dinocode/browser/dom-snapshots/<tabId>/<ISO>.html`
  - `.dinocode/browser/sessions/<tabId>-<ISO>/manifest.json`
  - `.dinocode/browser/traces/<tabId>/<ISO>.json`
  - `.dinocode/browser/state.json` (tab persistence, Phase 1)
  - `.dinocode/browser/allowlist.json` (Phase 0)
  - `.dinocode/browser/history.json` (Phase 1 address bar)
- `.gitignore` excludes the whole directory.
- "Open browser data folder" action in the browser settings drawer.

## Acceptance

- Gitignore verified.
- A one-line `ArtifactPaths` module exports helpers so no other module hardcodes paths.

## Progress

- Landed `packages/dinocode-browser/src/artifacts/ArtifactPaths.ts` — the single source of truth for every path the browser subsystem writes. Helpers: `artifactRoot`, `screenshotPath`, `networkBodyPath`, `domSnapshotPath`, `sessionManifestPath`, `tracePath`, `dailyLogPath`. Root-level files (`allowlist.json`, `state.json`, `history.json`) are exported as constants so startup wiring can enumerate them.
- Directory layout matches the bean's spec: `.dinocode/browser/{screenshots,network-bodies,dom-snapshots,sessions,traces,logs}/` scoped by `<tabId>`. The only deviation from the bean's literal text is the ISO colon → `-` rewrite (`12:34:56.789Z` → `12-34-56.789Z`) so the paths are Windows-friendly; the timestamp is still fully recoverable.
- Safety: every helper validates its inputs with strict regexes. `tabId` must match `BrowserTabIdSchema` (`[a-z0-9][a-z0-9_-]{0,63}`); ISO timestamps must match the `YYYY-MM-DDTHH:MM:SS(.sss)?Z` shape; request ids and extensions are filtered through a conservative slug. A caller cannot smuggle `..`, `/`, or control characters through the helper — an invalid input throws at the boundary.
- `.gitignore`: added `.dinocode/browser/` and `.dinocode/browser/**`, covering every subdirectory regardless of how deep the tool call buries an artifact.
- Package exports: new `@dinocode/browser/artifacts` subpath plus root barrel re-export. Tests `src/tests/artifactPaths.test.ts` (13 assertions) cover happy-path path building, directory-traversal rejection, and constant-list integrity. Full package suite is 92/92 green.
- Docs: rewrote `docs/dinocode-browser.md` §9 "Artifact storage" with the authoritative layout, callouts to the validation behavior, and the "Open browser data folder" action in the settings drawer anchored to the `ARTIFACT_ROOT_SEGMENT` constant.

---

## Why this bean exists (epic context)

One directory layout, one gitignore, one helper module.

## Dependencies

**Blocked by:**

- `dinocode-r4ns`

**Blocks:**

- `dinocode-07j6`
- `dinocode-7n6g`
- `dinocode-rfz5`
- `dinocode-aq1p`
- `dinocode-2lh1`
- `dinocode-lux5`

**Related:**

- _None._

## Testing

### Unit tests

- Path helpers; gitignore coverage.

### Integration / end-to-end

- Write + read + cleanup cycles.

### Manual QA

- Inspect `.dinocode/browser/**` after a test run; shapes match spec.

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
