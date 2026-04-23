---
# dinocode-7bew
title: "Browser: Find in page (⌘F)"
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
  - dinocode-qb85
  - dinocode-u2p2
---

## Why this bean exists

Find-in-page is a table-stakes browser feature for any serious debugging / reading task. Cheap to ship because Electron provides `webContents.findInPage`.

## Background

Electron exposes `findInPage(text, opts)` + `stopFindInPage(action)` + a `found-in-page` event with match count and active ordinal.

## In scope

- `⌘F` opens an inline find bar at the top of the browser panel.
- Enter = next, Shift+Enter = prev, Esc = close.
- Match count display; case-sensitivity toggle; whole-word toggle.

## Out of scope

- Regex search (defer).

## Subtasks

- [ ] FindBar component.
- [ ] Keybindings (respect keybinding-scope bean).
- [ ] Tests.

## Dependencies

**Blocked by:**

- `dinocode-qb85` — panel-skeleton
- `keybinding-scope` (UNRESOLVED — fix before commit)

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- FindBar state transitions.

### Integration / end-to-end

- Load text-heavy fixture; find 3 matches of a known string; navigate; assert highlight ordinal increments.

### Manual QA script

- Open any doc page; `⌘F`; type; verify highlights.

## Logging & observability

- Log open/close + match counts at `debug` level only.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Feature parity with Chrome's basic find-in-page.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
