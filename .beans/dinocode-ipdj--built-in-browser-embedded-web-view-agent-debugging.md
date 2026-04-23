---
# dinocode-ipdj
title: 'Built-in browser: embedded web view + agent debugging tools'
status: todo
type: epic
priority: high
tags:
    - phase-browser
    - infra
    - agent-tools
created_at: 2026-04-23T05:10:24Z
updated_at: 2026-04-23T05:46:39Z
---

Add a first-class, VSCode/Cursor-style embedded browser to Dinocode so the user can preview + Inspect Element any web app next to chat, and the agent can drive it as a tool suite (evaluate JS, read console/network, take screenshots, query/click/type, take accessibility snapshots, etc.).

## Who this serves

1. **The user**: a Chromium-grade browser docked in the app, with multi-tab, DevTools, per-project cookie scoping, error badges on tabs when the page throws, zoom + find-in-page, a Preview button in `ChatHeader` that auto-opens the detected dev-server URL, and a settings drawer for allowlist / partition clear / body-capture / auto-open.

2. **The agent**: a compact, auditable tool set with structured errors (`NAVIGATION_BLOCKED`, `TAB_CRASHED`, `EVALUATE_ERROR`, `TIMEOUT`, `NOT_FOUND`, `NOT_INTERACTABLE`, `USER_ACTIVE`, `PERMISSION_DENIED`, `RATE_LIMITED`, `TOO_MANY_TABS`, `INTERNAL`). Every interaction tool surfaces an "Agent is driving" banner with a "Take over" escape hatch. Every artifact (screenshot, PDF, trace, session recording) is written to `.dinocode/browser/**` and returned as a file path — never inlined — to keep agent context budgets small.

## Architectural anchor (fork rule)

Per `docs/dinocode-packages.md`, **all browser code lives in `packages/dinocode-browser`**. `apps/desktop`, `apps/web`, `apps/server`, and `packages/contracts` get only single-line `// dinocode-integration: browser ...` wires. No t3code internals are rewritten.

## Implementation anchor

- Electron `WebContentsView` (we are on Electron 40) — not `<webview>`, not `<iframe>` — so we get full DevTools and full CDP.
- Chrome DevTools Protocol via `webContents.debugger`. Multi-client (M89+) lets user DevTools + our agent client coexist.
- One `BrowserManager` service in main owns a tab pool + per-tab CDP + layout sync.
- Tool schemas come from `effect/Schema` and are consumed by `@dinocode/agent-tools` (`dinocode-ndam`), so Codex / Claude / Cursor adapters register them uniformly.
- Feature-flagged behind `features.builtInBrowser` (default off on main, on in beta channel) until the phases ship.

## Phased delivery (tag filter = `phase-browser`)

### Phase 0 — Foundations & Architecture (tag `phase-0-design`)

Everything needed before any runtime code is merged: architecture doc, package scaffold, CDP spike, IPC schemas + preload bridge, allowlist model, **test harness + fixtures**, **structured logging policy**, and a **feature flag** for gradual rollout.

### Phase 1 — Embedded view MVP (tag `phase-1-view`)

User-facing Chromium-grade browser panel: `BrowserManager`, renderer panel + bounds sync, address bar, DevTools toggle, failed-load + crash recovery, face route + `⌘⇧O`, multi-tab + tab strip, persistence, per-project partition, **downloads**, **upload (file-picker) delegation**, **permissions handler**, **certificate errors**, **window.open/popup handler**, **native JS dialogs**, **find in page**, **zoom**, **audio indicator + mute**, **UA + viewport emulation**, **print / save to PDF**, **clean shutdown + crash safety**, **renderer error boundary**, **tab discard**, **accessibility of the browser UI**, **keybinding scope/pass-through**.

### Phase 2 — CDP foundations + observability (tag `phase-2-cdp`)

`CdpAdapter`, console ring buffer, network ring buffer, tab error badge + peek drawer, runtime-exception capture.

### Phase 3 — Agent read tools (tag `phase-3-agent-read`)

Shared tool-definitions module + registration plumbing, `dinocode_browser_*`: open/list/close, navigate/reload/get_url, evaluate, get_console, get_network, get_accessibility_tree, screenshot. Plus print-to-PDF.

### Phase 4 — Agent interaction tools (tag `phase-4-agent-interact`)

`dinocode_browser_*`: query_selector, click/hover, type/press_key/fill_form, wait_for, pick_element (+ content-script overlay injection strategy), get_dom_snapshot. **Rate limiting** enforced across all interaction tools.

### Phase 5 — Safety, telemetry, and recording (tag `phase-5-safety`)

"Agent is driving" banner + take-over, per-tab agent action log panel, structured error taxonomy + retry policy, session recording + replay, artifact storage conventions, **settings panel** (allowlist/partition/body-capture/auto-open).

### Phase 6 — Project integration (tag `phase-6-project`)

Dev-server port detection, Preview button in `ChatHeader`/board, auto-open preview on Start Session for `ui`-tagged tasks, task ↔ browser-session binding.

### Phase 7 — Advanced / productization (tag `phase-7-later`)

Headless CLI mode, CDP multi-client hardening, **CDP/Electron version pin + drift detection**, **enterprise proxy support**.

## Testing strategy (cross-cutting)

Every phase ships with a dedicated end-to-end suite (`e2e-phase1` … `e2e-phase6`) built on the shared test harness (`test-harness`). All tests emit a trace id per action, dump structured logs to `.dinocode/browser/logs/test-run-<id>/` and surface them verbatim on failure. Unit tests are colocated with source modules; integration tests live under `packages/dinocode-browser/src/tests/`. No feature is considered "done" until its phase's e2e suite runs green ten consecutive times on CI.

## Observability strategy (cross-cutting)

`log-policy` defines the shared JSON log schema (`{ ts, level, component, traceId, tabId?, tool?, phase, msg, data? }`), redaction helpers for sensitive fields, and rotation under `.dinocode/browser/logs/`. `DINOCODE_BROWSER_DEBUG=debug` echoes everything to stderr in dev. Every downstream bean wires its logs through `logger.child({ component, traceId })`.

## Acceptance (epic-level)

- [ ] User can `⌘⇧O` to open the browser panel, navigate, inspect element, see Chrome-grade DevTools.
- [ ] Agent can call every tool in Phases 3 + 4 from the shared harness and from a live session; each tool returns structured JSON and obeys the canonical error taxonomy.
- [ ] Per-project cookie/storage isolation verified.
- [ ] Allowlist: default-localhost enforcement; agent-initiated unknown origins return `NAVIGATION_BLOCKED`.
- [ ] Every artifact path lands under `.dinocode/browser/**` and is gitignored.
- [ ] Structured logs cover every tool invocation; `DINOCODE_BROWSER_DEBUG=debug` works.
- [ ] All e2e phase suites green 10 runs in a row.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green.

## Risks (tracked; mitigated in specific beans)

- Layout flicker on `WebContentsView` resize (`panel-skeleton`, `browser-manager`).
- CDP attach conflict when user toggles DevTools (`cdp-multi-client`).
- Context token blow-up if we inline artifacts (`tool-screenshot`, `tool-dom-snapshot` return paths only).
- Agent hammering / DoS (`rate-limit`).
- Zombie `WebContentsView` after crash (`shutdown-quit`).
- Cookie / partition leakage (`session-partition`).
- Electron minor upgrade breaking CDP silently (`cdp-version-pin`).

## How to work the plan

Start at Phase 0 and move through the phases in order. Within a phase, follow the dependency graph encoded in each bean's `Blocked by:` list (we also run `beans list --ready` to surface unblocked work). Every bean's body is self-contained: Background, In scope / Out of scope, Subtasks, Dependencies, Testing (unit/integration/manual), Logging, Risks & mitigations, Acceptance. You should never need to leave the bean file to understand why it exists or how to finish it.
