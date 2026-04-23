---
# dinocode-bkmr
title: 'Browser: structured tool errors + retry policy docs'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Tight error taxonomy so agents can self-correct.

## Scope

- Error codes canonicalized in `packages/dinocode-browser/src/shared/errors.ts`:
  - `NAVIGATION_BLOCKED` — allowlist.
  - `TAB_CRASHED` — renderer gone.
  - `LOAD_FAILED` — HTTP/network error.
  - `EVALUATE_ERROR` — JS threw.
  - `TIMEOUT` — waiter expired.
  - `NOT_FOUND` — selector / tabId absent.
  - `NOT_INTERACTABLE` — element offscreen/disabled/detached.
  - `USER_ACTIVE` — user currently interacting.
  - `PERMISSION_DENIED` — user revoked agent control.
  - `TOO_MANY_TABS` — cap reached.
  - `INTERNAL` — unknown.
- Each error carries a structured `hint` the agent can use.
- `docs/dinocode-browser.md` has a "Retry-safe vs. fatal" table.

## Acceptance

- Every tool exits through the canonical error path (no raw `throw` escapes).
- Contract test enumerates each error code.
