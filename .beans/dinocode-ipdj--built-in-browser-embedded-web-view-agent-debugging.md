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
updated_at: 2026-04-23T05:10:24Z
---

Add a first-class, VSCode/Cursor-style embedded browser to Dinocode that the user can open for manual preview + DevTools debugging, and that the agent can drive as a tool suite (evaluate JS, read console/network, take screenshots, query/click/type, take accessibility snapshots, etc.).

## Vision

- **User**: one keystroke opens a Chrome-grade browser docked next to chat. Full Inspect Element. Multi-tab. Scoped cookies per project. Error badge on the tab when console has errors. "Open Preview" button in `ChatHeader` that boots the project's dev-server URL.
- **Agent**: a compact, auditable tool set (open/navigate/evaluate/screenshot/console/network/a11y-tree/click/type/wait) that the agent uses to close the loop on frontend work. Every action surfaces a "Agent is driving" banner with a "Take over" escape hatch. Artifacts (screenshots, traces, recordings) land in `.dinocode/browser/...` and are referenced by path in tool responses, never inlined.

## Architectural anchor

Per `docs/dinocode-packages.md`, **all of this lives in `packages/dinocode-browser`**. `apps/desktop`, `apps/web`, `apps/server`, and `packages/contracts` only get `// dinocode-integration: browser …` one-line wires. Zero t3code internals get rewritten.

## Implementation anchor

- Electron **`WebContentsView`** (Electron 30+; we're on 40) — not `<webview>` or `<iframe>` — so we get full DevTools and full CDP.
- Chrome DevTools Protocol via `webContents.debugger`. Multi-client since M89 means user DevTools + our agent client can coexist.
- One `BrowserManager` service in main owns a tab pool + per-tab CDP + layout sync.
- Tool schemas come from `effect/Schema` and are consumed by `@dinocode/agent-tools` (dinocode-ndam), so Codex/Claude/Cursor adapters register them uniformly.

## Phased delivery (child beans grouped by tag)

- **phase-0-design** — architecture doc, package scaffold, CDP spike, IPC schemas, security model.
- **phase-1-view** — embedded view MVP: `BrowserManager`, renderer panel, URL bar, DevTools toggle, tab strip, persistence, per-project partition.
- **phase-2-cdp** — CDP adapter, console + network ring buffers, error badge, runtime exception toast.
- **phase-3-agent-read** — tool definitions module + open/navigate/evaluate/console/network/a11y-tree/screenshot.
- **phase-4-agent-interact** — query_selector/click/type/wait_for/pick_element/dom_snapshot.
- **phase-5-safety** — "Agent is driving" banner, action log panel, structured tool errors, session recording, artifact storage.
- **phase-6-project** — dev-server port detection, Preview button, auto-open on Start Session, task↔browser-session binding.
- **phase-7-later** — headless CLI, CDP multi-client coordination.

## Acceptance (epic-level)

- User can `⌘⇧O` (or chosen shortcut) to open the browser panel, navigate, inspect element, and have full DevTools.
- Agent can call every tool in Phase 3 + Phase 4 successfully from a test harness; each tool returns structured JSON with clear error codes.
- Zero new lines of Dinocode logic inside `apps/**`, `packages/contracts/src/**`, or `packages/effect-*/**` beyond single-line integration wires annotated with `dinocode-integration: browser`.
- Per-project cookie/storage isolation verified: logging into project A never leaks into project B.
- Allowlist: by default the agent can only navigate to localhost / explicit project-configured origins; unknown origins require user confirm.
- `bun fmt && bun lint && bun typecheck && bun run test` green.

## Risks / open questions

- **Layout flicker** on `WebContentsView` resize — mitigate with a ResizeObserver-driven rect sync.
- **CDP attach conflict** when user opens DevTools — verified that M89+ allows multi-client, but need a coordinator that re-registers our subscriptions after DevTools attaches/detaches.
- **Token-blowup from inlining screenshots** — always save to disk and return a path.
- **Auth drift** — per-project partitions + default localhost-only allowlist keep third-party logins off the agent's path.

## References

- Electron `WebContentsView` docs.
- Chrome DevTools Protocol: Runtime, Page, DOM, Network, Accessibility, Target.
- Playwright MCP (similar tool surface for agent-driven browsers).
