---
# dinocode-j4ve
title: "Browser: pick-element overlay content-script injection"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-4-agent-interact
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-u1nj
  - dinocode-cnnp
---

## Why this bean exists

The user-assisted `pick_element` tool needs a crosshair + hover-highlight overlay injected into the page. Doing this via CDP `DOM.highlightNode` is fragile on pages with aggressive CSS. A tiny content-script injected in an isolated world gives us predictable behaviour and robust selector generation.

## Background

Use `Page.addScriptToEvaluateOnNewDocument` + `Runtime.addBinding` to install a minimal IIFE that runs in an isolated world. The IIFE listens for `mousemove` + `click`, computes a selector via a small, well-tested selector-generator (id → data-testid → stable class chain → nth-child). `Esc` cancels.

## In scope

- Isolated-world content script shipped with the package.
- Selector-generation algorithm + 40 fixture DOMs covering edge cases.
- Cancel + confirm protocol between content script and main.
- Respects CSP by using inline styles via shadow DOM where needed.

## Out of scope

- Visual theming customisation.

## Subtasks

- [ ] Content script + selector generator + tests.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-u1nj` — cdp-adapter
- `dinocode-cnnp` — ipc-schema

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `selectorGenerator.test.ts` — 40 fixture DOMs produce stable selectors.
- Selector round-trip: `querySelector(generate(el)) === el`.

### Integration / end-to-end

- Harness loads a page, picks an element, asserts the returned selector resolves to the same element via `document.querySelector`.

### Manual QA script

- Pick elements on real sites; verify robust selectors.

## Logging & observability

- Log selector-generation decisions at `trace` level.

## Risks & mitigations

- **CSP blocks inline content scripts** — Use `addScriptToEvaluateOnNewDocument` which is immune to page CSP.

## Acceptance criteria

- [ ] 40 fixtures all round-trip; integration test green.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
