---
# dinocode-jtbw
title: 'Browser: CDP spike (attach debugger to WebContentsView, evaluate + capture events)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Prove out the core CDP plumbing in a throwaway spike before building the real `BrowserManager`.

## Goal

Inside a short-lived Electron test script (or `apps/desktop` smoke test), spin up a `WebContentsView`, attach `webContents.debugger`, enable `Runtime` + `Page` + `Network` domains, navigate to a localhost URL, and:

- Evaluate `1 + 1` via `Runtime.evaluate`, assert the result.
- Capture a `Runtime.consoleAPICalled` event from `console.log` inside the page.
- Capture a `Network.requestWillBeSent` for the initial document load.
- Capture a `Runtime.exceptionThrown` from `throw new Error('x')` inside the page.
- Verify user `webContents.openDevTools()` still works with our debugger attached (multi-client).

## Acceptance

- Spike lives in `packages/dinocode-browser/src/tests/cdpSpike.test.ts` behind an env flag (requires Electron runtime).
- Results documented in `docs/dinocode-browser.md` "Verified assumptions" section.
- Spike deleted or converted into a real integration test once Phase 2 lands.
