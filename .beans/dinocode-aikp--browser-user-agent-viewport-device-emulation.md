---
# dinocode-aikp
title: 'Browser: user agent + viewport / device emulation'
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
    - dinocode-ousa
    - dinocode-u1nj
---

## Why this bean exists

Responsive-design debugging often requires emulating mobile viewports + touch events + different user agents. Chrome DevTools provides this natively but our panel benefits from a quick-toggle for common presets.

## Background

CDP domains: `Emulation.setDeviceMetricsOverride`, `Emulation.setUserAgentOverride`, `Emulation.setTouchEmulationEnabled`. Presets: Desktop, iPhone 15, iPad, Pixel 8.

## In scope

- Toolbar quick-picker with 4 presets + 'custom'.
- Agent tool `dinocode_browser_set_device({ tabId, preset | custom })`.
- Resets on tab close.

## Out of scope

- Sensor emulation (orientation etc.) — rare.

## Subtasks

- [ ] Preset table.
- [ ] Tool + UI.
- [ ] Tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-u1nj` — cdp-adapter

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Preset resolution + override dispatch.

### Integration / end-to-end

- Apply iPhone preset on a responsive fixture; assert `innerWidth === 390`.

### Manual QA script

- Manually toggle each preset on a real responsive site; verify layout.

## Logging & observability

- Log preset application `{ traceId, tabId, preset }`.

## Risks & mitigations

- **Breakage on SPAs that cache viewport** — Reset on navigation.

## Acceptance criteria

- [ ] Each preset selectable from UI + agent tool.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
