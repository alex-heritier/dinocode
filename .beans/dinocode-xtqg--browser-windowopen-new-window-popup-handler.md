---
# dinocode-xtqg
title: "Browser: window.open / new-window / popup handler"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-bs50
  - dinocode-sdqj
---

## Why this bean exists

Pages that use `window.open` or links with `target=_blank` must either open in a new tab in our browser (preferred) or be explicitly denied. Without a handler they try to open native windows which we can't control.

## Background

Electron's `webContents.setWindowOpenHandler(({ url }) => action)` is the canonical way. Policy: allow if origin passes allowlist → open as new tab; else deny with a toast.

## In scope

- `setWindowOpenHandler` installed per tab.
- `action: 'allow'` returns native window options that route to our TabStrip.
- Deny path shows a toast + logs.
- Handles `features` (popup vs new tab semantics): always map to new tab regardless.

## Out of scope

- Actual native Electron popup windows (we never want them).

## Subtasks

- [ ] Handler + routing into `BrowserManager.createTab`.
- [ ] Tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-bs50` — multi-tab
- `dinocode-sdqj` — allowlist

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Allow/deny matrix against allowlist states.

### Integration / end-to-end

- Click a `target=_blank` link in a fixture page; assert a new tab appears with expected URL.
- Denied origin opens nothing but emits a toast event.

### Manual QA script

- OAuth-style 'open popup' flow on a test fixture; ensure popup surfaces as a tab and closes back into the opener via `postMessage`.

## Logging & observability

- Log each window-open with `{ traceId, openerTabId, targetUrl, decision }`.

## Risks & mitigations

- **Pages rely on popup-centric positioning / dimensions** — We ignore dimensions; pages that break are documented as 'use full-page flows' in the readme.

## Acceptance criteria

- [ ] No native window escapes; every window-open is either a new tab or denied.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
