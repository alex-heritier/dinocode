---
# dinocode-lux5
title: 'Browser: settings panel (allowlist, partition, body-capture, auto-open)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-5-safety
    - settings
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-sdqj
    - dinocode-ctrl
    - dinocode-ive4
    - dinocode-jzfg
    - dinocode-vkd6
    - dinocode-gepm
---

## Why this bean exists

Users need one place to manage: per-project allowlist, clear browser data, enable network-body capture, toggle auto-open preview on Start Session, choose default zoom, view active tabs and permissions, inspect logs.

## Background

Lives in the existing settings panel infrastructure (`SettingsPanels.tsx`) under a new 'Built-in Browser' section, gated by the feature flag.

## In scope

- Section: Allowlist — add/remove origins, per project.
- Section: Data — 'Clear browser data', choose partition migration behaviour.
- Section: Network — enable/disable response-body capture default; max body size.
- Section: Preview — toggle 'Auto-open preview on Start Session'.
- Section: Privacy — list granted permissions per origin; revoke.
- Section: Logs — 'Open logs folder', 'Copy recent trace for bug report'.

## Out of scope

- Sync across devices.

## Subtasks

- [ ] Section components + tests.

## Dependencies

**Blocked by:**

- `dinocode-sdqj` — allowlist
- `dinocode-ctrl` — session-partition
- `dinocode-ive4` — network-buffer
- `dinocode-jzfg` — auto-open-preview
- `dinocode-vkd6` — permissions-handler
- `dinocode-gepm` — log-policy

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Each section's state transitions.

### Integration / end-to-end

- Set allowlist to empty; agent navigate blocked; add origin; navigate succeeds.

### Manual QA script

- Walk every section; confirm persistence across restart.

## Logging & observability

- Log every settings mutation with `{ traceId, section, field, oldValue, newValue }` (oldValue redacted if sensitive).

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Every section functional and persists.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
