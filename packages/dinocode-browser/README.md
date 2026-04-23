# @dinocode/browser

**@dinocode/browser** owns Dinocode's built-in browser: the Electron main-
process `BrowserManager`, the preload `contextBridge`, the renderer panel,
the shared IPC schemas, and the agent tool handlers that drive an embedded
Chromium `WebContentsView` through the Chrome DevTools Protocol (CDP).

This package is the single home for every "built-in browser" feature. No
browser-specific code should land in `apps/web`, `apps/server`, or
`apps/desktop` except for thin integration points annotated with
`// dinocode-integration: dinocode-browser <feature>`. See
`docs/dinocode-packages.md` for the policy and
`docs/dinocode-browser.md` for the architecture.

## Responsibilities

- **Main** (`src/main/`) — `BrowserManager` service, CDP adapter, tab registry,
  per-project session partitions, artifact storage, and IPC handlers. Runs in
  the Electron main process and may import `electron` freely.
- **Preload** (`src/preload/`) — `contextBridge` exposer. Runs in the Electron
  preload context and exposes a narrow, typed surface to the renderer.
- **Renderer** (`src/renderer/`) — `<BrowserPanel />`, hooks, and stores. Runs
  in the renderer (DOM + React). Embedded by `apps/web` via a single
  integration point.
- **Shared** (`src/shared/`) — schemas and types that cross the main/preload/
  renderer boundary. Process-agnostic; must not import from `electron`, `react-
dom`, or Node-only modules.
- **Tools** (`src/tools/`) — agent tool definitions (schemas + handlers) that
  drive the browser programmatically. Imported by the server's provider
  adapters via an integration point.
- **Tests** (`src/tests/`) — unit + spike tests. Integration tests that need a
  real Electron runtime live under `apps/desktop/tests/` and import this
  package.
- **Testing** (`src/testing/`) — the in-process harness
  (`withBrowser`, `FakePage`, `TinyServer`, `TraceRecorder`) used by
  every downstream test. Zero Electron dependency; pure Node.

## Test harness

Every downstream bean composes its tests via `withBrowser(opts, fn)` so
the setup stays consistent and the trace dump on failure is uniform:

```ts
import { describe, expect, it } from "vitest";
import { FIXTURES, withBrowser } from "@dinocode/browser/testing";

describe("console capture", () => {
  it("reports error entries within 1s", async () => {
    await withBrowser({}, async ({ openPage, server }) => {
      const page = openPage({ tabId: "tab-1", url: server.urlFor(FIXTURES.console) });
      page.pushConsole({ level: "error", text: "boom" });
      const hit = await page.expectConsole({ level: "error" }).within(1000);
      expect(hit.text).toBe("boom");
    });
  });
});
```

Key primitives:

- `withBrowser(opts, fn)` — async scope that starts a `TinyServer` on
  `127.0.0.1:0`, hands you a `TraceRecorder`, and cleans everything up
  on both success and exception paths.
- `FakePage` — deterministic in-memory simulator exposing
  `pushConsole`, `pushNetwork`, `pushNavigation`, `crash`, `close`, plus
  `expectConsole` / `expectNetwork` matchers with `.within(ms)` timeouts.
- `standardFixtures()` + `FIXTURES` — canned HTML pages for `/hello`,
  `/console`, `/network`, `/form`, `/crash`, `/redirect`, `/slow`.
- `TraceRecorder` — captures every harness step; dumps to `stderr` on
  test failure. Set `DINOCODE_BROWSER_TEST_DEBUG=1` to also print on
  success.

The real Electron-in-process path lands with `dinocode-ousa`; that bean
will plug a live `BrowserManager` into the same `withBrowser` entry
point without changing any existing tests.

## Integration points

- `apps/desktop` — creates a `BrowserManager` in the main process and wires
  it into the existing window lifecycle. Single integration site.
- `apps/web` — imports `<BrowserPanel />` from `@dinocode/browser/renderer`
  and mounts it beside the chat view.
- `apps/server` — imports tool handlers from `@dinocode/browser/tools` and
  exposes them to provider adapters.

All other coupling is forbidden; the CI drift guard
(`scripts/check-t3code-drift.ts`) enforces this alongside the
`dinocode-integration:` annotation convention.

## Allowed dependencies

- ✅ `effect`, `@dinocode/contracts` (once extracted), `electron` (peer, main/
  preload only), `react` + `react-dom` (peer, renderer only).
- 🚫 `@t3tools/*` internals, `apps/*` paths, direct DB access.

## Status

Scaffold only. Feature work lives under the `phase-browser` tag in the beans
tracker; see parent epic `dinocode-ipdj`.
