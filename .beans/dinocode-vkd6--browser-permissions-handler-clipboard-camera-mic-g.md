---
# dinocode-vkd6
title: "Browser: permissions handler (clipboard / camera / mic / geo / notifications)"
status: todo
type: task
priority: high
tags:
  - phase-browser
  - phase-1-view
  - security
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-sdqj
---

## Why this bean exists

Embedded pages will ask for clipboard / camera / microphone / geolocation / notifications. Without an explicit policy Electron uses its defaults, which prompt the user inconsistently or grant silently. For an IDE-embedded browser the right default is 'deny everything; user-allow per origin; agent-can-never-grant'.

## Background

Electron exposes `session.setPermissionRequestHandler(cb)` and `setPermissionCheckHandler(cb)`. Policy lives per partition (per project). UI is a tiny inline prompt in the browser panel (not a native OS dialog).

## In scope

- Default-deny all permission requests.
- In-panel inline prompt for allow-once / always-allow / deny (only for user gestures; ignored during agent drives).
- Persistent storage of per-origin decisions under `.dinocode/browser/permissions.json`.
- Agent tool calls that trigger a permission prompt return `PERMISSION_DENIED` with a hint to ask the user.
- Permission list: `clipboard-read`, `clipboard-write`, `media` (camera + mic), `geolocation`, `notifications`, `midi`, `pointerLock`, `openExternal`, `fullscreen`.

## Out of scope

- Per-site settings UI deep-linking (covered by `settings-panel`).

## Subtasks

- [ ] Implement handler in `BrowserManager.install`.
- [ ] Persistence module + migrations.
- [ ] Inline prompt component.
- [ ] Tests for every permission code.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-sdqj` — allowlist

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `permissionPolicy.test.ts` — default deny; user-allow persists; agent gesture never allows.

### Integration / end-to-end

- Fixture page calls `navigator.clipboard.readText()` → prompt appears; user allows; subsequent calls skip prompt.
- Same fixture during an agent drive → rejected without prompt; tool returns `PERMISSION_DENIED`.

### Manual QA script

- Visit a test page that requests camera access; click allow-once; revisit after restart; expect denied unless 'always' was chosen.

## Logging & observability

- Log every permission request `{ traceId, origin, permission, source:'user'|'agent', decision, persisted }`.

## Risks & mitigations

- **User habituation (clicks 'allow' blindly)** — Prompt copy explicitly warns when the request came during an agent drive.

## Acceptance criteria

- [ ] All 9 permission codes handled end-to-end.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
