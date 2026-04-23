---
# dinocode-ayoh
title: 'Browser: CDP multi-client coordination with user DevTools'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-7-later
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Hard-harden the shared-CDP case where both our `CdpAdapter` and Chrome DevTools are attached.

## Scope

- Document observed behavior differences across Chromium versions.
- Guard against our subscriptions being silently dropped when DevTools toggles.
- Auto-resubscribe on `Debugger.paused`/`Debugger.resumed` cycles triggered by user breakpoints.
- Regression tests using the Phase 0 spike harness.

## Acceptance

- Opening DevTools, hitting a breakpoint, resuming — our ring buffers keep capturing without gaps.
- Documented limitations where multi-client is fundamentally lossy (if any).
