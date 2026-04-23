---
# dinocode-yqtt
title: "Browser: clean shutdown + main-process crash safety"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-1-view
  - reliability
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-ctrl
  - dinocode-crea
---

## Why this bean exists

An orderly app quit must close every `WebContentsView`, detach every CDP debugger, flush log buffers, and persist tab state. A main-process crash mid-session must not leave zombie renderer processes or half-written `state.json` files.

## Background

Hook `app.on('before-quit')` for orderly shutdown; set `app.on('quit')` for last-chance cleanup. Use atomic writes (`write to tmp + rename`) for every JSON state file. On unexpected main crash, the stale PID check at next startup cleans up any leftover partition locks.

## In scope

- `BrowserManager.dispose({ reason: 'quit'|'crash' })` handles both paths.
- Atomic-write helper used everywhere we touch `.dinocode/browser/*.json`.
- Startup check: detect stale lock files, prune zombie partitions.
- Integration test: kill the main process mid-load; next launch recovers without data loss.

## Out of scope

- OS-level process-tree reaping (OS handles).

## Subtasks

- [ ] Shutdown path.
- [ ] Atomic-write helper.
- [ ] Stale-state cleanup.
- [ ] Crash-recovery test.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-ctrl` — session-partition
- `dinocode-crea` — persist-tabs

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Atomic-write helper tests (interrupted mid-write).

### Integration / end-to-end

- SIGKILL the harness mid-session; assert next start shows expected recovered tabs.

### Manual QA script

- Force-quit the real app with open tabs; relaunch; verify tabs restore.

## Logging & observability

- Log every `dispose()` call with `{ reason, tabCount, durationMs }`.

## Risks & mitigations

- **Partition locks stuck after crash** — Explicit PID-file cleanup during startup scan.

## Acceptance criteria

- [ ] Zero zombie `WebContentsView` or partition locks after crash.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
