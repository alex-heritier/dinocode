---
# dinocode-qb85
title: 'Browser: renderer panel skeleton + bounds sync placeholder'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:33Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-ousa
    - dinocode-cnnp
---

Ship the smallest possible renderer that proves the layout-sync loop end-to-end.

## Scope

- `packages/dinocode-browser/src/renderer/BrowserPanel.tsx`.
- Renders a `<div data-browser-slot />` with `ResizeObserver` that posts bounds to main via the preload bridge.
- Shows "Starting…" placeholder until `tab:created` event arrives.
- Zero Chrome aesthetics yet — just prove bounds sync stays correct during window resize, sidebar resize, and DevTools toggle.

## Acceptance

- Panel mounts in a dedicated route `/_chat/browser/$environmentId/$projectId` (or a dock slot; concrete placement = bean "Browser: face route + toggle keybinding").
- Bounds stay in sync during: window resize, fullscreen toggle, chat-sidebar resize, DevTools open/close.
- Unmounting removes the underlying `WebContentsView`.


---

## Why this bean exists (epic context)

The minimal renderer primitive — a `<div>` that stays aligned with the main-process `WebContentsView`. Everything visual in Phase 1 composes against this contract.

## Dependencies

**Blocked by:**

- `dinocode-ousa`
- `dinocode-cnnp`

**Blocks:**

- `dinocode-49oz`
- `dinocode-tb6r`
- `dinocode-oxax`
- `dinocode-2g71`
- `dinocode-bs50`
- `dinocode-7bew`
- `dinocode-er1u`
- `dinocode-m570`
- `dinocode-2rrs`
- `dinocode-u2p2`
- `dinocode-wjfu`

**Related:**

- _None._

## Testing

### Unit tests

- ResizeObserver feeds bounds to the preload bridge.
- Unmount clears the underlying view.

### Integration / end-to-end

- Window resize + sidebar resize + DevTools toggle all re-sync bounds within one frame.

### Manual QA

- Rapid resize-drag; verify zero flicker.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Bounds drift when animations are in flight** — Clamp bounds until animation settles (MutationObserver).

## Acceptance criteria (superset)

- [ ] Panel mounts into the browser face route.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
