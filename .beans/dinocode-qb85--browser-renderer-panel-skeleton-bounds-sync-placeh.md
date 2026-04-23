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
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
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
