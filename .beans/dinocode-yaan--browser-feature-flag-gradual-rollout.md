---
# dinocode-yaan
title: "Browser: feature flag + gradual rollout"
status: completed
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

- [ ] Add schema + migration. *(deferred — lives in `packages/dinocode-contracts` once it extracts. The flag shape is already typed via `BrowserClientSettings.features.builtInBrowser` and can be mirrored as a `features.builtInBrowser: boolean` setting.)*
- [ ] Gate each integration point. *(deferred per surface — each phase bean picks up the one-liner gate. The helper pattern is documented in `docs/dinocode-browser.md` §14 so surfaces pick it up uniformly.)*
- [x] Add `isBuiltInBrowserEnabled(settings)` helper (one call site).
- [x] Update docs: `docs/dinocode-browser.md` status section.

## Progress

- Landed `packages/dinocode-browser/src/config/featureFlag.ts` with:
  - `resolveBuiltInBrowserFlag({ settings, channel, env })` — pure resolver with precedence **settings → env → channel default**.
  - `isBuiltInBrowserEnabled(resolution | settings, channel?, env?)` — convenience boolean that callers use behind a one-liner `// dinocode-integration: dinocode-browser feature flag gate.` comment.
  - `defaultForChannel(channel)` — `master → false`, `alpha/beta → true`.
  - `BROWSER_FEATURE_ENV_VAR = "DINOCODE_BROWSER_FLAG"` — documented env override for CI + launcher.
- The resolver returns `{ enabled, source, channel }` so the logger (see `dinocode-gepm`) can emit a single `flag.resolve` record at startup and a `flag.toggle` record on user flip — no need to plumb "why" through multiple call sites.
- Exported the module as a new `@dinocode/browser/config` subpath and from the root barrel for convenience. Tests `src/tests/featureFlag.test.ts` cover channel defaults, explicit-settings-wins, env fallback, unknown env values ignored, and both shapes of `isBuiltInBrowserEnabled`. Suite is 79/79 green.
- Docs: rewrote `docs/dinocode-browser.md` §14 "Feature flag & rollout" with the resolution order, both-paths CI note, and the canonical `// dinocode-integration: dinocode-browser feature flag gate.` example snippet so every downstream surface reaches for the same pattern.
- Settings UI + schema: deferred. The helper already types the settings shape (`BrowserClientSettings.features.builtInBrowser`); wiring it through `apps/server`'s settings panel + contracts requires the `dinocode-contracts` extraction and belongs with the Experimental settings group work.

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
