---
# dinocode-ybmy
title: 'Browser: audio indicator + mute control per tab'
status: todo
type: task
priority: low
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-bs50
---

## Why this bean exists

Test harnesses and review flows play audio; silencing a tab without closing is a basic affordance Chrome pioneered. `webContents.setAudioMuted()` and `audio-state-changed` give us what we need.

## Background

`webContents.on('audio-state-changed')` fires when a tab starts/stops producing audio; `setAudioMuted(bool)` toggles mute.

## In scope

- Speaker icon on tab chip when tab is audible.
- Click icon to toggle mute.
- Keybinding `⌘M` mutes active tab.

## Out of scope

- Volume level control per tab.

## Subtasks

- [ ] State tracking + tab chip UI.
- [ ] Keybinding.
- [ ] Tests.

## Dependencies

**Blocked by:**

- `dinocode-bs50` — multi-tab

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Audio-state event → icon-visibility mapping.

### Integration / end-to-end

- Fixture page that autoplays silent audio (to keep CI quiet); assert indicator appears; mute; assert API reflects muted state.

### Manual QA script

- Play a YouTube video in a tab; mute via icon.

## Logging & observability

- Log mute/unmute at `debug`.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Chrome-parity audio indicator.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
