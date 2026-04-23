---
# dinocode-6os6
title: 'Browser: ''Agent is driving'' banner + take-over flow'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-5-safety
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Make it visible and reversible when the agent is manipulating the browser.

## Scope

- When any interaction tool (Phase 4) runs, set `tab.agentActive = true` for the tab's duration-of-action (+ 1s debounce after the last action).
- Render a non-blocking banner across the top of the embedded view: "Agent is using this tab" + "Take over" button.
- "Take over" cancels any in-flight action and posts `agent.browserTakenOver(tabId)` to the server → agent receives a `PERMISSION_DENIED` on next call for that tab until user re-grants.
- Banner auto-dismisses 1s after the agent stops acting.

## Acceptance

- Agent cannot steal input while a user is actively typing (input focus + recent user activity → interaction tools return `USER_ACTIVE` with a hint).
- "Take over" verified in an integration test.
