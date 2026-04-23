---
# dinocode-2rrs
title: 'Browser: accessibility of the browser UI itself'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
    - accessibility
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-qb85
    - dinocode-49oz
    - dinocode-bs50
---

## Why this bean exists

The browser panel, tab strip, URL bar, and all dialogs must be keyboard-navigable and screen-reader-friendly. We care about the tools we ship, not just the pages they render.

## Background

Follow WAI-ARIA authoring practices for tab widgets, toolbars, dialogs. Use `@base-ui/react` primitives where applicable.

## In scope

- Tab strip: role='tablist' + arrow-key traversal.
- URL bar: proper labelling, focus-within outline, aria-activedescendant for autocomplete.
- All dialogs: focus trap, Esc to close, restore focus to trigger.
- Color contrast ≥ AA for all states.
- Voiceover/NVDA smoke test documented.

## Out of scope

- Accessibility of embedded pages (not ours).

## Subtasks

- [ ] axe-core automated audit in CI.
- [ ] Manual Voiceover script.
- [ ] Fix any violations.

## Dependencies

**Blocked by:**

- `dinocode-qb85` — panel-skeleton
- `dinocode-49oz` — address-bar
- `dinocode-bs50` — multi-tab

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Each control asserts required aria attributes via testing-library.

### Integration / end-to-end

- axe-core run against the mounted panel → zero violations.

### Manual QA script

- Full keyboard-only flow: open browser, navigate, open DevTools, close — no mouse.

## Logging & observability

- Axe violation counts logged on every render in dev mode.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Zero axe-core violations; keyboard-only navigation covers every action.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
