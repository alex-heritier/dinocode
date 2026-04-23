---
# dinocode-m570
title: "Browser: renderer error boundary around BrowserPanel"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
  - reliability
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-qb85
---

## Why this bean exists

If `BrowserPanel.tsx` throws, the whole chat app shouldn't crash. A React error boundary isolates failures and offers a 'Reload browser panel' path.

## Background

Standard React 19 error-boundary pattern. On catch: log, render fallback UI, keep chat and board fully functional.

## In scope

- `BrowserPanelErrorBoundary` component.
- 'Reload browser panel' button remounts the panel (and disposes/recreates the `WebContentsView`).

## Out of scope

- Automatic retry loop.

## Subtasks

- [ ] Component + tests.

## Dependencies

**Blocked by:**

- `dinocode-qb85` — panel-skeleton

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Boundary catches synchronous + async errors.

### Integration / end-to-end

- Inject an error into `BrowserPanel` child and assert fallback UI; clicking 'Reload' restores a healthy panel.

### Manual QA script

- Force an error via `throw` in a test build; assert the app doesn't crash.

## Logging & observability

- Log every caught error with stack + component tree.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Panel crashes never bring down chat/board surfaces.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
