---
# dinocode-u2p2
title: "Browser: keybinding scope + pass-through policy"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-qb85
  - dinocode-2g71
---

## Why this bean exists

When the embedded page has keyboard focus, the user still needs `⌘⇧O` (face toggle), `⌘T` (new tab), `⌘W` (close tab), `⌘F` (find), and chat-level shortcuts to work. But the embedded page also needs typing to go through. A clear scope policy prevents 'key eaten by browser tab' bugs.

## Background

Electron's `before-input-event` lets us intercept before the page sees the key. We filter for global shortcuts and let everything else through.

## In scope

- Allowlist of global shortcuts that always win when the browser panel has focus.
- Everything else passes through to the embedded page.
- Chat-level shortcuts (e.g. `⌘⇧N` for new thread) continue to work even with browser focused.
- Documented matrix in `docs/dinocode-browser.md`.

## Out of scope

- User-configurable keybinding overrides — future.

## Subtasks

- [ ] Interceptor + matrix + tests.

## Dependencies

**Blocked by:**

- `dinocode-qb85` — panel-skeleton
- `dinocode-2g71` — face-toggle

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Shortcut-matrix unit tests covering every reserved binding.

### Integration / end-to-end

- Focus the embedded page, press `⌘T`; assert a new tab appears AND the page received no key event.
- Focus the page, press `a`; assert the page received it AND no global action fired.

### Manual QA script

- Try every shortcut in the matrix with the embedded page focused.

## Logging & observability

- Log every interception decision at `debug` level.

## Risks & mitigations

- **Shortcut matrix drift between platforms** — Matrix parameterised by `process.platform` with per-platform tests.

## Acceptance criteria

- [ ] Matrix covers every reserved shortcut; no false pass-throughs.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
