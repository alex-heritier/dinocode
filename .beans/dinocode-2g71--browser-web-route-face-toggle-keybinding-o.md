---
# dinocode-2g71
title: 'Browser: web route + face toggle keybinding (⌘⇧O)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:46:34Z
parent: dinocode-ipdj
blocked_by:
    - dinocode-qb85
---

Wire the browser panel into the existing chat faces model (parallel to `⌘⇧B` for the board).

## Scope

- New command `browser.toggleFace` registered in `@t3tools/contracts`' `STATIC_KEYBINDING_COMMANDS` via the usual dinocode-integration one-liner.
- Default keybinding `⌘⇧O` in `apps/server/src/keybindings.ts`.
- Route: `/_chat/browser/$environmentId/$projectId`.
- Sidebar segmented pill gains a third segment `Chat | Board | Browser` when the project has at least one tab open (otherwise hidden — symmetry with Board pill when no tasks).
- `ChatHeader` gets a "Preview" icon that opens the active project's browser face (actual auto-open of dev server comes in Phase 6).

## Acceptance

- `⌘⇧O` toggles between chat and browser face for the active project.
- Route works when nav'd to directly.
- Tests for `resolveToggleBrowserFaceAction` pure-logic module (mirrors `toggleFace.logic.ts`).


---

## Why this bean exists (epic context)

Completes the `Chat | Board | Browser` faces model introduced with the kanban UX. A single shortcut to flip between debugging and coding.

## Dependencies

**Blocked by:**

- `dinocode-qb85`

**Blocks:**

- `dinocode-u2p2`
- `dinocode-8xd5`

**Related:**

- `dinocode-yaan`

## Testing

### Unit tests

- `resolveToggleBrowserFaceAction` pure tests.

### Integration / end-to-end

- Keyboard path end-to-end works from chat focus.

### Manual QA

- `⌘⇧O` repeatedly — always toggles; never gets stuck.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.
- Log each toggle decision with from/to face.

## Risks & mitigations

- **Shortcut conflict with system** — macOS reserves few `⌘⇧<letter>` bindings; `O` is free; document.

## Acceptance criteria (superset)

- [ ] Third pill segment ('Browser') appears when feature flag on.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.
