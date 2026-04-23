---
# dinocode-7n6g
title: 'Browser: print / Save-to-PDF + agent tool'
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
    - dinocode-87ah
    - dinocode-u1nj
    - dinocode-dyjh
---

## Why this bean exists

Agents occasionally need to preserve a page's rendered state as a durable artifact (longer-lived than a screenshot). `Page.printToPDF` produces a vector PDF of the full scroll height.

## Background

CDP `Page.printToPDF` returns base64 PDF; we save to disk under `.dinocode/browser/pdfs/<tabId>/<ISO>.pdf` and return a path.

## In scope

- User keyboard `⌘P` opens native print dialog (default Electron).
- Agent tool `dinocode_browser_print_pdf({ tabId, format?, margin? })` → `{ path, bytes }`.

## Out of scope

- Print-to-physical-printer automation.

## Subtasks

- [ ] Agent tool + tests.

## Dependencies

**Blocked by:**

- `dinocode-87ah` — tool-defs-module
- `dinocode-u1nj` — cdp-adapter
- `dinocode-dyjh` — artifact-storage

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Tool input validation.

### Integration / end-to-end

- Print a 3-page fixture; assert PDF exists and has expected page count (via minimal PDF parsing).

### Manual QA script

- `⌘P` opens Electron print UI.

## Logging & observability

- Log PDF generations `{ traceId, tabId, path, bytes, format }`.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Both user and agent paths work.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
