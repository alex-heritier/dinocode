---
# dinocode-yaan
title: "Browser: feature flag + gradual rollout"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-0-design
  - safety
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-r4ns
---

## Why this bean exists

The browser subsystem touches Electron main, renderer, agent tools, and storage — a lot of surface area to land without regressions. A feature flag lets us merge code incrementally while keeping the flag off for users who aren't opted in, matching AGENTS.md's 'reliability first' priority.

## Background

t3code has a settings store already (`apps/server/src/clientPersistence.ts` + `SettingsPanels`). We add a single `features.builtInBrowser` setting (default `off` on main branch; flipped on in alpha/beta channels). When off, the face-toggle shortcut is a no-op, the preview button is hidden, the server skips tool registration, and the Electron main-process module does not install the `BrowserManager`.

## In scope

- Add `features.builtInBrowser: boolean` to the client settings schema (in `@dinocode/contracts`, not `@t3tools/contracts`).
- Wire the flag into: face-toggle (Phase 1), agent tool registration (Phase 3), Preview button (Phase 6), `BrowserManager.install` (Phase 1).
- Settings UI checkbox under an 'Experimental' section.
- Default off on `master`; default on in the beta channel config.

## Out of scope

- Server-driven feature flags / experiments — we're strictly client-side toggles.

## Subtasks

- [ ] Add schema + migration.
- [ ] Gate each integration point.
- [ ] Add `isBuiltInBrowserEnabled(settings)` helper (one call site).
- [ ] Update docs: `docs/dinocode-browser.md` status section.

## Dependencies

**Blocked by:**

- `dinocode-r4ns` — pkg-scaffold

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `featureFlag.test.ts` — default state per channel.
- Each integration point has a test with the flag off asserting zero side effects.

### Integration / end-to-end

- Launch desktop with flag off: no DOM for the browser panel rendered; tool list served to agent omits browser tools.

### Manual QA script

- Flip the flag in Settings; expect a one-time toast 'Restart to apply' (restart avoided where possible by lazy-installing the main-process service on next open).

## Logging & observability

- Log the flag state at app startup once; log on each toggle with `action: 'flag.toggle'`.

## Risks & mitigations

- **Dead code paths rot** — Both-paths CI: run the full test suite twice, once with the flag forced on and once forced off.

## Acceptance criteria

- [ ] Flag turns off every visible and non-visible surface of the subsystem cleanly.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
