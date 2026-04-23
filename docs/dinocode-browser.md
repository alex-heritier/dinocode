# Dinocode Browser Architecture

**Status**: Draft v0.1
**Owner**: Alex Heritier
**Scope**: The `packages/dinocode-browser` subsystem — a first-class Chromium-grade
browser embedded in the Dinocode desktop app, plus an agent-driven tool suite over
Chrome DevTools Protocol.

> This document is the single spine that every Phase 0–7 bean in epic
> [`dinocode-ipdj`](../.beans/dinocode-ipdj--built-in-browser-embedded-web-view-agent-debugging.md)
> references. Subsequent beans cite sections here for their contracts. Do not
> start downstream implementation work without updating this doc first.

## 1. Overview

The browser subsystem adds a dockable Chromium-grade browser panel to Dinocode
and exposes a structured tool suite the agent can use to drive it. It serves
two audiences simultaneously:

1. **The user** — previews a running web app next to chat, inspects elements
   with real Chrome DevTools, sees error badges on tabs, and scopes cookies
   per project.
2. **The agent** — navigates, evaluates JS, reads console/network, takes
   screenshots and accessibility snapshots, queries/clicks/types, and records
   sessions — with structured errors, a visible "Agent is driving" banner,
   and artifacts written to `.dinocode/browser/**` as file paths (never
   inlined in context).

### Principles

- **One process surface** — `WebContentsView` inside Electron main, driven by
  a single `BrowserManager` service.
- **One protocol surface** — Chrome DevTools Protocol (CDP) via
  `webContents.debugger`.
- **One fork rule** — All browser code lives in `packages/dinocode-browser`.
  `apps/desktop`, `apps/web`, `apps/server`, and `packages/contracts` get only
  single-line `// dinocode-integration: browser ...` wires.
- **Artifacts as paths, not bytes** — Every screenshot, trace, recording, or
  DOM snapshot the agent requests is written to disk and the tool returns a
  path. This keeps context windows small and makes artifacts auditable.

## 2. High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Electron Main Process (Node.js)                  │
│                                                                     │
│  ┌────────────────────┐        ┌──────────────────────────────┐     │
│  │  BrowserManager    │◀──────▶│  WebContentsView pool        │     │
│  │  (packages/        │        │  (one per open tab, one per  │     │
│  │   dinocode-browser)│        │   per-project partition)     │     │
│  └────────┬───────────┘        └────────┬─────────────────────┘     │
│           │                             │                           │
│           │ CDP (webContents.debugger)  │                           │
│           ▼                             ▼                           │
│  ┌────────────────────┐        ┌──────────────────────────────┐     │
│  │ CdpAdapter         │        │ Ring buffers                 │     │
│  │ • attach/detach    │        │ • console events             │     │
│  │ • domain enable    │        │ • network events             │     │
│  │ • event fan-out    │        │ • runtime exceptions         │     │
│  └────────┬───────────┘        └────────┬─────────────────────┘     │
│           │                             │                           │
│           │           IPC (preload bridge, structured schemas)      │
└───────────┼─────────────────────────────┼───────────────────────────┘
            │                             │
┌───────────┼─────────────────────────────┼───────────────────────────┐
│           ▼                             ▼                           │
│    Electron Renderer (Chromium)                                     │
│  ┌────────────────────┐   ┌──────────────────────────────────┐      │
│  │ BrowserPanel       │   │ Agent Action Log / Driving       │      │
│  │ (apps/web via      │   │ Banner / Take-over UI            │      │
│  │  dinocode-browser) │   │                                  │      │
│  └────────────────────┘   └──────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
            ▲                             ▲
            │ WebSocket (Effect RPC)      │ tool calls (JSON-RPC)
            │                             │
┌───────────┴─────────────────────────────┴───────────────────────────┐
│                   apps/server (Node.js/Bun)                         │
│  Shared tool-definitions (packages/dinocode-agent-tools)            │
│  registers `dinocode_browser_*` on every provider adapter.          │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Processes & surfaces

### 3.1 Main process (`packages/dinocode-browser/main`)

Owns all long-lived browser state. Exposes Effect layers:

- `BrowserManager` — tab pool, lifecycle (create/close/crash/persist),
  per-project partition selection, layout sync coordination.
- `CdpAdapter` — debugger attach/detach with auto-reattach on navigation,
  domain enable/disable, event fan-out to ring buffers.
- `ArtifactStore` — writes screenshots/traces/recordings/DOM snapshots under
  `.dinocode/browser/**`, returns absolute paths.
- `NavigationPolicy` — allowlist check before every top-level navigation.
- `Logger` — `logger.child({ component, traceId })`, JSON lines, rotated.

### 3.2 Renderer (`packages/dinocode-browser/renderer`)

Reusable React components + hooks consumed by `apps/web`:

- `BrowserPanel` — the host pane that forwards bounds updates to main so
  `WebContentsView` can track the panel rectangle.
- `TabStrip`, `AddressBar`, `DevToolsToggle`, `FindInPage`, `ZoomControls`,
  `AudioIndicator`, `AgentDrivingBanner`, `PerTabActionLog`, `SettingsPanel`.
- `useBrowserTabs`, `useBrowserConsole`, `useBrowserNetwork` — hooks that
  subscribe to the WS streams.

`apps/web` has a single integration point per surface (route wire-up,
composer button, chat header preview button) and no browser logic inline.

### 3.3 Preload (`packages/dinocode-browser/preload`)

Thin `contextBridge` surface that exposes a typed `window.dinocodeBrowser`
API. All messages are schema-validated with `effect/Schema` on both sides.

The bridge is a pure-wiring module (see `packages/dinocode-browser/src/preload/bridge.ts`, ≤ 80 lines) with two exposed
methods:

- `invoke(envelope)` — renderer → main RPC; resolves to a `BrowserToolResponse`.
- `subscribe(handler)` — main → renderer push stream over
  `dinocode.browser.event`; returns an unsubscribe handle.

IPC channel names are centralised in `BrowserIpcChannels` so that only
`dinocode.browser.invoke`, `dinocode.browser.subscribe`,
`dinocode.browser.unsubscribe`, and `dinocode.browser.event` cross the
contextBridge boundary. No other channel is reachable from the renderer.

### 3.3.1 IPC schema (shared contracts)

Every payload is described by an Effect `Schema` in
`packages/dinocode-browser/src/shared/schemas.ts`:

| Schema                   | Direction             | Purpose                                                         |
| ------------------------ | --------------------- | --------------------------------------------------------------- | ---------------------------------- |
| `BrowserTabState`        | main → renderer       | Tab status, URL, title, loading progress, nav history.          |
| `BrowserNavigationEvent` | main → renderer       | `start`/`committed`/`finished`/`failed`/`redirected` phases.    |
| `BrowserConsoleEntry`    | main → renderer       | Ring-buffer rows from `Runtime.consoleAPICalled`.               |
| `BrowserNetworkEntry`    | main → renderer       | Ring-buffer rows from `Network.requestWillBeSent/...`.          |
| `BrowserToolRequest`     | renderer/agent → main | Typed agent/UI tool invocation with `traceId` + args.           |
| `BrowserToolResponse`    | main → renderer/agent | Tagged `{ ok }                                                  | { error }`result with`durationMs`. |
| `BrowserToolError`       | embedded in response  | Structured error taxonomy (`TabNotFound`, `CdpDetached`, …).    |
| `BrowserActionLogEntry`  | main → renderer       | Per-tab agent-is-driving banner log entries.                    |
| `BrowserInvokeEnvelope`  | renderer → main       | Outer envelope around a `BrowserToolRequest`.                   |
| `BrowserEventEnvelope`   | main → renderer       | Tagged union of all push events (tab.state, tab.navigation, …). |

Round-trip tests under `packages/dinocode-browser/src/tests/schemas.test.ts`
assert `decode ∘ encode === identity` for every schema and that malformed
payloads surface as structured `ParseError`s (not `undefined`).

Integration contract: `apps/desktop/src/preload.ts` imports
`exposeDinocodeBrowserBridge` once, marked with a
`// dinocode-integration: dinocode-browser preload bridge.` annotation, and
passes Electron's own `contextBridge` + `ipcRenderer`. No other
`apps/desktop` file touches dinocode-browser IPC.

### 3.7 Server (`apps/server`)

Hosts:

- A WS RPC group `dinocodeBrowser.*` (defined in
  `packages/dinocode-contracts`, not `@t3tools/contracts`) that streams
  console/network events and per-tab status.
- The agent tool registrations, which delegate to the main-process
  `BrowserManager` over IPC when running inside Electron, and to a headless
  adapter when running under CLI (Phase 7).

### 3.4 Navigation allowlist & security model

The allowlist is the single enforcement point for origin safety. It
lives in `packages/dinocode-browser/src/security/Allowlist.ts` as a
pure decision module (`input → decision`, no FS/network/clock) so the
same function powers the main-process tool handlers, the renderer
confirm dialog, and unit/integration tests.

**Default workspace allow-list.** `localhost`, `127.0.0.1`, `::1`,
`*.local`, plus any origins declared in
`.dinocode/config.yml → browser.allowedOrigins`. Persistence of
user-granted origins lives under `.dinocode/browser/allowlist.json`
(workspace-scoped, gitignored) and is read/written by the
`BrowserManager` (see `dinocode-ousa`).

**Default deny-list.** Common credential-phishing / OAuth / SSO
targets: `accounts.google.com`, `login.microsoftonline.com`,
`login.live.com`, `github.com/login`, `github.com/sessions`,
`appleid.apple.com`, `id.apple.com`, `auth0.com`, `*.okta.com`. Users
can extend via `.dinocode/config.yml → browser.deniedOrigins`. **Deny
beats allow** — you cannot override a deny-list entry from the
allow-list.

**Decision matrix** — agents see three outcomes: `allowed`, `denied`,
or the equivalent error. Users also get `confirmRequired`.

| Initiator | Host known allow | Host known deny | Unknown host       |
| --------- | ---------------- | --------------- | ------------------ |
| agent     | `allowed`        | `denied`        | `denied`           |
| user      | `allowed`        | `denied`        | `confirmRequired`  |

`denied` carries one of: `InvalidUrl` (unparseable URL), `Denylisted`
(matched a deny entry), or `NotInAllowlist`. Agent-initiated navigation
outside the allow-list returns a `NavigationBlocked` browser error with
the default hint (see §3.5).

**Pattern syntax** is deliberately small:
- `example.com` — exact host match (case-insensitive).
- `*.example.com` — any subdomain (at least one label); the bare apex
  does not match.
- `host/path-prefix` — path-scoped entry (used by the deny-list to
  target e.g. `github.com/login` without blocking the whole site).
- IPv4/IPv6 literals — matched exactly after bracket normalisation.

Anything more exotic (mid-label wildcards, regex) is a policy bug;
`parseHostPattern` throws so settings UIs can surface the error.

User-facing confirm copy reads:
> "This project's agent has not been granted access to `<origin>`.
> Allow once / Always allow / Cancel."

"Always allow" calls `addToAllowList({ policy, origin })` and persists
the updated policy back to `.dinocode/browser/allowlist.json`. The
decision module itself never persists; that stays in the manager.

### 3.5 Error taxonomy & retry policy

Every browser tool exits through the canonical error union in
`packages/dinocode-browser/src/shared/errors.ts`. No tool is allowed to
throw past the handler boundary; the IPC and WebSocket layers validate
the response shape via `BrowserToolErrorSchema`.

Each error carries a `kind`, a short human `message`, a `retryable`
boolean, a short agent-targeted `hint`, and optional `details`.

**Retry-safe vs. fatal**

| Kind                 | Class     | Default hint (abbrev.)                                         |
| -------------------- | --------- | -------------------------------------------------------------- |
| `NavigationBlocked`  | fatal     | Ask the user to allowlist this host.                           |
| `TabCrashed`         | fatal     | Reload the tab or open a fresh one.                            |
| `LoadFailed`         | retryable | Retry once; then check URL or network.                         |
| `EvaluateError`      | fatal     | Inspect `get_console` and fix the expression.                  |
| `Timeout`            | retryable | Increase timeout or retry; verify selector/URL.                |
| `NotFound`           | retryable | Query accessibility tree to confirm the element exists.        |
| `NotInteractable`    | retryable | Scroll into view; wait for enabled state.                      |
| `UserActive`         | retryable | Wait for the takeover banner to clear.                         |
| `PermissionDenied`   | fatal     | Ask the user to re-enable agent control.                       |
| `TooManyTabs`        | fatal     | Close an existing tab via `close_tab`.                         |
| `BufferOverflow`     | fatal     | Request a newer cursor.                                        |
| `RateLimited`        | retryable | Back off briefly; the per-tab quota will refill.               |
| `CdpDetached`        | retryable | Manager auto-reattaches; retry the action.                     |
| `Internal`           | fatal     | Capture `traceId` from logs and file a bean.                   |

Handlers SHOULD retry `retryable` errors once with ~250 ms backoff
before surfacing to the agent. `fatal` errors MUST be returned
immediately so the agent can pick a different strategy (or defer to
the user). The authoritative policy lives in
`BROWSER_ERROR_RETRY_POLICY` and is exercised by
`src/tests/errors.test.ts` against the wire schema literals to prevent
drift.

Hints are static defaults; call sites can override per-invocation by
passing `{ hint }` into `BrowserError(...)`, e.g. including the
observed selector or URL.

### 3.6 Logging & trace IDs

Every process in the browser subsystem uses a shared logger living in
`packages/dinocode-browser/src/logging`. The shape was chosen so we never
have to reconstruct causality after the fact.

**Log record schema** (JSON-line):

```json
{
  "ts": "2026-04-23T12:34:56.789Z",
  "level": "info",
  "component": "dinocode-browser.main",
  "traceId": "lq3x8a2-f4a19b3c0d5e6721",
  "tabId": "tab-1",
  "tool": "dinocode_browser_navigate",
  "phase": "request",
  "msg": "navigate requested",
  "data": { "url": "https://example.com" }
}
```

**Trace-id lifecycle.** A trace id is minted (`createTraceId()`) at the
outermost boundary — typically the agent SDK adapter that receives a tool
call from the provider, or the renderer event handler that initiates a
user gesture. The id rides on `BrowserToolRequest.traceId` across the
preload bridge and lands in `BrowserToolResponse` and every
`BrowserActionLogEntry`. Main-process handlers attach the id to every
log record they emit (`logger.child({ traceId, tool })`) so a single
tool call produces correlated records across agent → server → main →
CDP → renderer layers.

**Levels** (`error < warn < info < debug < trace`) gate emission; the
default is `info`. `DINOCODE_BROWSER_DEBUG` controls the stderr echo
level: `1`/`true` → `debug`, `verbose` → `trace`, `0`/`false`/`off`
silences everything but errors. Unknown values fall back to `info`.

**Redaction.** Network and `evaluate` tool handlers MUST pass headers
and argument bags through `redact()` before logging. Default keys
(`authorization`, `cookie`, `set-cookie`, `proxy-authorization`,
`x-api-key`, `x-auth-token`, `x-dinocode-auth-token`, `password`,
`secret`, `token`, `access_token`, `refresh_token`, `id_token`) are
replaced with `"[REDACTED]"`; call sites can extend the set but cannot
relax it. Redaction is deep, case-insensitive, immutable, and cycle-safe.

**Sinks.** The package ships a memory sink (for tests) and a no-op
sink. The Electron main process wires in a file-rotating sink writing to
`.dinocode/browser/logs/<date>.log` (gitignored, 10 MiB × 7 files); the
rotation sink lives with the `BrowserManager` bean because it needs
`node:fs`. Sinks that throw are caught and reported via a fallback
record so a broken sink never crashes the main process.

## 4. Why `WebContentsView` (not `<webview>` or `<iframe>`)

| Option              | Pros                                                                                                        | Cons                                                                         | Decision                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| `<iframe>`          | Zero Electron ceremony.                                                                                     | No DevTools, no CDP, no crash isolation, `X-Frame-Options` breaks most apps. | Rejected.                               |
| `<webview>`         | Simple markup.                                                                                              | Deprecated in Electron, no `WebContentsView` parity, limited bounds control. | Rejected.                               |
| `WebContentsView`   | Full Chromium process isolation, real DevTools, full CDP, per-view partitions, first-class in Electron 30+. | Requires bounds-sync from renderer to main; extra lifecycle code.            | **Chosen.**                             |
| `BrowserView` (old) | Used to work in Electron 28-.                                                                               | Superseded by `WebContentsView` in Electron 30+.                             | Not applicable — we are on Electron 40. |

`WebContentsView` gives us:

- Real `webContents.debugger` API → CDP.
- Real `webContents.openDevTools()` → user DevTools that the agent can share
  via CDP multi-client (Chrome 89+ / Electron 28+).
- `session.fromPartition('dinocode-project:<id>')` for cookie/storage scoping.
- Independent crash reporter per tab.

## 5. Chrome DevTools Protocol usage

We rely on the following CDP domains. Each is enabled lazily when the first
consumer subscribes, and disabled when the last consumer unsubscribes.

| Domain          | Why                                                                                         | Consumers                                                   |
| --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `Runtime`       | `evaluate`, `consoleAPICalled`, `exceptionThrown`.                                          | `evaluate` tool, console ring buffer, tab badges.           |
| `Page`          | `navigate`, `reload`, `frameNavigated`, `frameAttached`, `printToPDF`, `captureScreenshot`. | Address bar, navigation tools, screenshot tool, print tool. |
| `DOM`           | `getDocument`, `querySelector`, `querySelectorAll`, `resolveNode`, `describeNode`.          | Interaction tools, pick-element overlay, DOM snapshot tool. |
| `Accessibility` | `getFullAXTree`, `getPartialAXTree`.                                                        | `get_accessibility_tree` tool.                              |
| `Network`       | `requestWillBeSent`, `responseReceived`, `loadingFailed`, `getResponseBody` (optional).     | `get_network` tool, network ring buffer.                    |
| `Target`        | `attachedToTarget`, `detachedFromTarget`, `createTarget`, popup/new-window handling.        | Multi-tab orchestration, window.open handler.               |
| `Input`         | `dispatchMouseEvent`, `dispatchKeyEvent`.                                                   | `click`, `hover`, `type`, `press_key`.                      |
| `Log`           | `entryAdded` (browser-level warnings).                                                      | Console ring buffer (tagged `log`).                         |

### 5.1 Multi-client coordination

CDP in Chrome 89+ / Electron 28+ supports multiple clients on the same
target. When the user opens DevTools while the agent is attached, both
clients receive events. Constraints:

- Domain state is shared — enabling `Network` twice is a no-op. The
  `CdpAdapter` keeps a reference count per domain so the user can close
  DevTools without stealing events from the agent.
- Some commands are exclusive — e.g. `Fetch.enable` with interception.
  We avoid those in the default tool set; the Phase 7 `cdp-multi-client`
  bean adds explicit coordination for the exceptions.
- Input events go through regardless of DevTools state. The "Agent is
  driving" banner still surfaces to the user.

### 5.1.1 Capture buffers (console + network)

Both observability surfaces are backed by a shared bounded ring buffer
(`packages/dinocode-browser/src/capture/`). The buffers are pure data
structures — the CDP adapter feeds them, and agent tools + renderer
widgets consume them, but the buffers themselves never import `electron`
or touch I/O. This keeps them trivially testable and reusable.

| Buffer                 | Capacity | Feeds (CDP)                                                                        | Consumers                                                       |
| ---------------------- | -------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `ConsoleRingBuffer`    | 1000     | `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Log.entryAdded`            | `dinocode_browser_get_console`, tab error badge, recording.     |
| `NetworkRingBuffer`    | 500      | `Network.requestWillBeSent`, `Network.responseReceived`, `Network.loadingFinished` / `Network.loadingFailed` | `dinocode_browser_get_network_requests`, recording, settings.   |

Key guarantees:

- **Monotonic cursor.** Every entry gets a strictly increasing `seq`
  number that is never reused across evictions, so pagination via
  `drain({ since, limit })` cannot skip or duplicate entries even when
  the consumer falls behind; `droppedBefore` on the response tells the
  consumer how many entries were evicted from the window they missed.
- **Argument marshalling** (console only) collapses arbitrary
  `RemoteObject`-shaped values into a compact `{ kind, text, json? }`
  form with circular-reference safety (`[Circular]`) and a configurable
  string ceiling (default 4 KiB). Errors decompose to
  `{ name, message, stack }`.
- **Body capture is opt-in.** The network buffer only stores metadata;
  response bodies are fetched on demand via `Network.getResponseBody`
  and streamed to `.dinocode/browser/network-bodies/<tabId>/` (see
  Section 9). The `unlockNetworkBodies` face is the user gesture that
  flips the flag.
- **Redaction at egress.** Headers are stored verbatim so users can
  inspect them, but every log line and IPC hop routes through the
  shared `redact()` helper from `@dinocode/browser/logging` so
  authorization tokens never leak off-device.

### 5.2 Auto-reattach

`webContents.debugger.detach()` fires on any cross-origin navigation or
crash. `CdpAdapter` listens for `webContents.on('did-navigate')` and
re-attaches with the same ref-counted domain set so tool calls remain
stable across navigations. This is covered by bean
[`dinocode-u1nj`](../.beans/dinocode-u1nj--browser-cdpadapter-attachdetach-auto-reattach-on-n.md).

## 6. Per-project session partitions

Every project gets a dedicated Electron session:

```
session.fromPartition(`dinocode-project:${projectId}`)
```

Properties:

- **Cookies + storage** isolated per project.
- **Downloads directory** defaults to `.dinocode/browser/downloads/<projectId>/`.
- **Permissions** (clipboard, camera, mic, geolocation) are scoped per
  partition and tracked in the settings panel.
- **Clearing** a project's session does not affect other projects.

Opening the browser panel without an active project uses a fallback
`dinocode-default` partition that is isolated from all projects.

## 7. Allowlist & navigation policy

Default posture: **deny-by-default for agent-initiated navigations**;
**allow-by-default for user-initiated navigations**.

Policy resolution order:

1. If the URL scheme is `file:`, `about:`, or `chrome-devtools:` — deny.
2. If the URL host matches `localhost`, `127.0.0.1`, or `::1` — allow.
3. If the URL matches an entry in `.dinocode/config.yml` → `browser.allowlist`
   — allow.
4. If the user is driving (last input gesture < `USER_ACTIVE_GRACE_MS`) — allow.
5. Otherwise — deny with `NAVIGATION_BLOCKED` error. The UI shows a confirm
   toast ("Allow navigation to example.com? [Allow once] [Allow always]").

The allowlist check runs in the main process via
`webContents.on('will-navigate')` and `session.webRequest.onBeforeRequest`
so it cannot be bypassed from the renderer.

## 8. Tab lifecycle

```
┌─ BrowserManager.openTab({ url, projectId })
│   ├─ acquire partition (or create if first use)
│   ├─ new WebContentsView({ webPreferences: { sandbox: true, ... } })
│   ├─ attach CdpAdapter (ref-count domains)
│   ├─ wire to panel bounds via IPC
│   └─ emit tab.opened
│
├─ running
│   ├─ webContents.on('render-process-gone') → tab.crashed → recovery UI
│   ├─ webContents.on('did-fail-load')       → tab.failedLoad → retry UI
│   ├─ session.webRequest blocked            → tab.navigationBlocked
│   └─ CdpAdapter auto-reattach on navigation
│
└─ BrowserManager.closeTab(tabId)
    ├─ detach CdpAdapter (ref-count to 0 → disable domains)
    ├─ close WebContentsView
    ├─ persist state (url, scroll, zoom)
    └─ emit tab.closed
```

**Persistence**: `state.json` in the partition directory stores the last
N tabs per project (url, title, zoom, scroll, favicon). On next open, the
panel restores tabs lazily (discarded state, loaded on focus — see
`dinocode-g5pr`).

**Crash safety**: The main process treats `render-process-gone` as
recoverable. `BrowserManager.shutdown()` during app quit waits for all
pending artifacts to flush, then closes views.

## 9. Artifact storage

All artifacts live under the repository's `.dinocode/browser/` directory
so they are always discoverable from the project root and gitignored by
default. The canonical layout is owned by
`packages/dinocode-browser/src/artifacts/ArtifactPaths.ts` — no other
module hardcodes any of these paths; every write site imports a helper
(`screenshotPath`, `networkBodyPath`, `domSnapshotPath`,
`sessionManifestPath`, `tracePath`, `dailyLogPath`) so the layout stays
coherent.

```
<project>/
  .gitignore                          # excludes .dinocode/browser/**
  .dinocode/browser/
    allowlist.json                    # navigation allowlist (dinocode-sdqj)
    state.json                        # tab persistence (dinocode-crea)
    history.json                      # address bar history (dinocode-49oz)
    logs/
      <yyyy-mm-dd>.log                # rotating logger sink (dinocode-gepm)
    screenshots/
      <tabId>/
        <ISO8601>.png
    network-bodies/
      <tabId>/
        <requestId>.<ext>
    dom-snapshots/
      <tabId>/
        <ISO8601>.html
    sessions/
      <tabId>-<ISO8601>/
        manifest.json                 # + per-frame assets
    traces/
      <tabId>/
        <ISO8601>.json
```

Every helper validates its inputs — `tabId`, ISO timestamps, request
ids, and extensions are filtered through strict regexes so a caller
cannot escape the artifact root via `..`. The ISO colon is rewritten
to `-` because Windows and some tar tooling dislike colons in
filenames; the underlying timestamp is still fully recoverable.

Tools that produce an artifact return the project-relative path in
their structured response. The `manifest.json` under `sessions/`
records `{ tool, traceId, tabId, startedAt, finishedAt }` so session
recording (Phase 5) can correlate artifacts to tool calls.

An "Open browser data folder" action in the browser settings drawer
reveals the root in the OS file manager — `ARTIFACT_ROOT_SEGMENT`
(`.dinocode/browser`) is the single constant it resolves against.

## 10. Agent tool surface

All agent tools are defined in
`packages/dinocode-browser/src/tools/definitions.ts` using `effect/Schema`
and registered uniformly by `packages/dinocode-agent-tools` on every
provider adapter.

### 10.1 Read tools (Phase 3)

| Tool name                                 | Purpose                                                  | Bean            |
| ----------------------------------------- | -------------------------------------------------------- | --------------- |
| `dinocode_browser_open`                   | Open a new tab (allowlist-checked).                      | `dinocode-w0qv` |
| `dinocode_browser_list_tabs`              | List tabs + their status for a project.                  | `dinocode-w0qv` |
| `dinocode_browser_close_tab`              | Close a tab.                                             | `dinocode-w0qv` |
| `dinocode_browser_navigate`               | Navigate an existing tab.                                | `dinocode-t2l9` |
| `dinocode_browser_reload`                 | Reload the current page.                                 | `dinocode-t2l9` |
| `dinocode_browser_get_url`                | Return the tab's current URL + title.                    | `dinocode-t2l9` |
| `dinocode_browser_evaluate`               | Run JS via `Runtime.evaluate`, return JSON + value path. | `dinocode-yne5` |
| `dinocode_browser_get_console`            | Return console ring buffer since a cursor.               | `dinocode-c3lk` |
| `dinocode_browser_get_network`            | Return network ring buffer since a cursor.               | `dinocode-w19p` |
| `dinocode_browser_get_accessibility_tree` | Return AX tree (full or partial).                        | `dinocode-56ga` |
| `dinocode_browser_screenshot`             | Capture full-page or viewport PNG, return path.          | `dinocode-07j6` |
| `dinocode_browser_print`                  | Save current page as PDF, return path.                   | `dinocode-7n6g` |

### 10.2 Interaction tools (Phase 4)

| Tool name                           | Purpose                                                      | Bean            |
| ----------------------------------- | ------------------------------------------------------------ | --------------- |
| `dinocode_browser_query_selector`   | Resolve a selector to a stable node ref.                     | `dinocode-cbcb` |
| `dinocode_browser_click`            | Click a node ref (with hover-first option).                  | `dinocode-kww9` |
| `dinocode_browser_hover`            | Hover a node ref.                                            | `dinocode-kww9` |
| `dinocode_browser_type`             | Type text into a node ref (focuses first).                   | `dinocode-34kt` |
| `dinocode_browser_press_key`        | Dispatch a key event.                                        | `dinocode-34kt` |
| `dinocode_browser_fill`             | Replace a field's value (clears first).                      | `dinocode-34kt` |
| `dinocode_browser_wait_for`         | Wait for a selector / URL / network-idle / custom predicate. | `dinocode-mexx` |
| `dinocode_browser_pick_element`     | Let the user point at an element, return node ref.           | `dinocode-pyoi` |
| `dinocode_browser_get_dom_snapshot` | Return coarse DOM snapshot (structure + text) as a path.     | `dinocode-aq1p` |

### 10.3 Error taxonomy

Every tool returns either `{ ok: true, ... }` or `{ ok: false, code, message, data? }`
where `code` is one of:

- `NAVIGATION_BLOCKED` — allowlist denied a navigation.
- `TAB_CRASHED` — target `webContents` has gone.
- `EVALUATE_ERROR` — `Runtime.evaluate` threw or returned a non-cloneable value.
- `TIMEOUT` — operation exceeded `timeoutMs`.
- `NOT_FOUND` — selector matched nothing / node ref no longer valid.
- `NOT_INTERACTABLE` — element hidden, disabled, covered, or outside viewport.
- `USER_ACTIVE` — user is driving (last input gesture within grace window) and
  tool policy refuses to steal input.
- `PERMISSION_DENIED` — permission (clipboard/camera/mic/geolocation) denied.
- `RATE_LIMITED` — per-tab or per-tool quota exceeded (see `dinocode-te2e`).
- `TOO_MANY_TABS` — max tabs per project reached.
- `INTERNAL` — catch-all; includes an opaque trace id for log correlation.

Errors never include raw HTML, cookies, secrets, or file contents — those go
through `redact()` before serialization.

### 10.4 Retry policy

Tools that mutate state (`click`, `type`, `press_key`, `fill`, `navigate`)
are not retried automatically. Tools that are pure observers (`evaluate`
with idempotent JS, `get_*`, `wait_for`) may be retried with exponential
backoff and jitter, capped at 3 attempts total. The client side decides;
the server only surfaces the structured error.

## 11. User UX surfaces

- `⌘⇧O` — toggle the browser panel for the active project.
- Address bar supports URL, search, `dinocode://…` for internal routes.
- DevTools toggle — mounts the standard Chrome DevTools in a side dock
  sharing the CDP connection with the agent.
- Tab strip with drag-reorder, audio indicator, error badge.
- Error badge on tab expands a quick-peek drawer with the latest console
  error + "Copy as CDP trace" + "Ask agent to fix".
- Find-in-page (`⌘F`), Zoom (`⌘=` / `⌘-` / `⌘0`).
- Preview button in `ChatHeader` auto-opens the detected dev-server URL
  (Phase 6, `dinocode-8xd5` + `dinocode-756x`).
- Agent-is-driving banner with `Take over` → stops in-flight agent actions,
  disables interaction tools until the user releases.
- Per-tab Agent Action Log panel (Phase 5) shows every tool call + result
  with the trace id linking to the log file.

## 12. Logging & observability

The shared `Logger` service emits newline-delimited JSON:

```json
{
  "ts": "2026-04-23T12:34:56.789Z",
  "level": "info",
  "component": "BrowserManager",
  "traceId": "01HV..",
  "tabId": "tab-xyz",
  "phase": "open",
  "msg": "tab opened",
  "data": { "url": "http://localhost:3000" }
}
```

- `DINOCODE_BROWSER_DEBUG=debug` mirrors to stderr and to the test harness
  artifact directory.
- Log rotation: one file per day under `.dinocode/browser/logs/<projectId>/`,
  30-day retention by default.
- Secrets go through `redact()` (cookies, auth headers, file contents,
  anything matching the secret-regex list from
  [`docs/observability.md`](./observability.md)).
- Trace ids are propagated through IPC as an opaque string; every tool call
  generates a fresh trace id and returns it in the result envelope.

## 13. Testing strategy

- **Unit tests** colocated with modules (`src/**/*.test.ts`). Deterministic,
  no Electron, use the CDP mock from `test-harness`.
- **Integration tests** under `packages/dinocode-browser/src/tests/`.
  Spin up the `BrowserManager` against the real Electron runtime via
  `electron-mocha` + the shared `test-harness` fixtures.
- **Phase e2e suites** under `packages/dinocode-browser/e2e/<phase>/`:
  - `e2e-phase1` — embedded view MVP (`dinocode-cfbt`).
  - `e2e-phase2` — CDP foundations (`dinocode-yuwy`).
  - `e2e-phase3` — agent read tools (`dinocode-hiab`).
  - `e2e-phase4` — agent interaction tools (`dinocode-cqdr`).
  - `e2e-phase5` — safety + recording (`dinocode-6yf1`).
  - `e2e-phase6` — project integration (`dinocode-c3uw`).

Every test emits its own trace id, dumps logs under
`.dinocode/browser/logs/test-run-<id>/`, and surfaces the log tail
verbatim on failure. A feature is not "done" until its phase's suite
runs green 10 consecutive times on CI.

## 14. Feature flag & rollout

`features.builtInBrowser` is the single gate for the entire subsystem.
It lives on the client settings object and is resolved through
`resolveBuiltInBrowserFlag({ settings, channel, env })` in
`packages/dinocode-browser/src/config/featureFlag.ts`. Every surface
that needs to consult the flag (face toggle, agent tool registration,
preview button, `BrowserManager.install`) calls
`isBuiltInBrowserEnabled(...)` — no other code path reads the setting
directly.

**Resolution order (highest wins):**

1. Explicit `settings.features.builtInBrowser` (user toggled the
   switch). Emits `source: "settings"`.
2. `DINOCODE_BROWSER_FLAG` env var (`1`/`true`/`on` or
   `0`/`false`/`off`), set by the launcher, CI, or manual overrides.
   Emits `source: "env"`.
3. Release-channel default: `master` → `false`, `alpha`/`beta` →
   `true`. Emits `source: "channel"`.

The resolution object carries `{ enabled, source, channel }` so the
logger can emit one structured `flag.resolve` record at startup and a
`flag.toggle` record whenever the user flips the switch. Dead-code
rot is prevented by a "both-paths" CI matrix (run the suite once with
the flag forced on and once forced off via
`DINOCODE_BROWSER_FLAG=1` / `=0`).

**Expected wiring.** Integration points in `apps/*` follow this shape:

```ts
// dinocode-integration: dinocode-browser feature flag gate.
import {
  isBuiltInBrowserEnabled,
  resolveBuiltInBrowserFlag,
} from "@dinocode/browser/config";

const flag = resolveBuiltInBrowserFlag({
  settings: clientSettings,
  channel: RELEASE_CHANNEL,
  env: process.env,
});
if (!isBuiltInBrowserEnabled(flag)) return;
```

When `off`, the browser menu/keybinding/preview button are hidden, the
agent tool list served over WS omits `dinocode_browser_*` tools, and
the main process does not install `BrowserManager` (no CDP session,
no `WebContentsView`, no per-project partition is created).

## 15. Integration points (`dinocode-integration:` surface)

Each integration is a one-line annotation per
[`docs/dinocode-packages.md`](./dinocode-packages.md). Expected surface:

- `apps/desktop/src/main.ts` — register the `BrowserManager` IPC handlers
  at startup.
- `apps/web/src/routes/_chat.browser.*.tsx` — route that mounts
  `BrowserPanel` from `@dinocode/browser/renderer`.
- `apps/web/src/components/chat/ChatHeader.tsx` — Preview button.
- `apps/server/src/server.ts` — provide the `@dinocode/browser/server` layer.
- `packages/dinocode-contracts/src/browser.ts` — WS RPC + IPC schemas.

No new fields are added to t3code's `ClientSettings` / `ServerSettings`.
Browser settings live in `.dinocode/config.yml` under `browser:` and in
`localStorage` under `dinocode.browser.*` for ephemeral renderer prefs.

## 16. Open questions

1. **CDP multi-client coordination for `Fetch.enable` interception** — Do
   we ever need request interception, and if so, how do we arbitrate with
   the user's DevTools? Tracked by `dinocode-ayoh`; decision deferred to
   Phase 7.
2. **Layout flicker on `WebContentsView` resize** — The initial spike
   confirmed `setBounds` is synchronous but subpixel rounding produces
   flicker during split-pane drag. Two mitigations under evaluation:
   (a) a transparent mask overlay during resize, (b) `contentLimitsOption`
   heuristics. Tracked by `dinocode-qb85`.
3. **Electron minor upgrade breaking CDP silently** — Chromium can drop
   CDP methods between minors. `dinocode-27vx` pins the Electron version
   and wires a CI job that runs the CDP test suite against every upgrade.
4. **Enterprise proxy support** — Enterprise customers route egress
   through a proxy; `session.setProxy` works but credential prompts need
   UI. Tracked by `dinocode-6vwu`.
5. **Certificate errors for self-signed dev certs** — Default posture is
   to prompt the user once per `origin + fingerprint`. Details in
   `dinocode-6xeu`.

## 17. Risks & mitigations

| Risk                                           | Mitigation                                                     | Bean                             |
| ---------------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| Layout flicker on `WebContentsView` resize     | Renderer panel skeleton + coalesced bounds updates.            | `dinocode-qb85`                  |
| CDP attach conflict when user toggles DevTools | Ref-counted domain enable + multi-client coordination policy.  | `dinocode-ayoh`                  |
| Context token blow-up if artifacts are inlined | Screenshot / PDF / DOM tools always return paths, never bytes. | `dinocode-07j6`, `dinocode-aq1p` |
| Agent hammering / DoS                          | Per-tab + per-tool rate limits with `RATE_LIMITED` error.      | `dinocode-te2e`                  |
| Zombie `WebContentsView` after crash           | Clean-shutdown hook + crash-safe state recovery.               | `dinocode-yqtt`                  |
| Cookie / partition leakage across projects     | Per-project partition + settings-panel wipe flow.              | `dinocode-ctrl`, `dinocode-lux5` |
| Electron upgrade breaking CDP silently         | Version pin + drift-detection CI job.                          | `dinocode-27vx`                  |

## 18. Change control

Every PR that touches `packages/dinocode-browser` must also touch this
document (or explicitly note why no update is needed). CODEOWNERS will
flag the omission.

## Related

- Epic: [`dinocode-ipdj`](../.beans/dinocode-ipdj--built-in-browser-embedded-web-view-agent-debugging.md).
- Package layout: [`docs/dinocode-packages.md`](./dinocode-packages.md).
- Observability policy: [`docs/observability.md`](./observability.md).
- Spec: [`DINOCODE.md`](../DINOCODE.md).
