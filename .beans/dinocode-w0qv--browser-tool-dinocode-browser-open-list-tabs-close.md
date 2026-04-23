---
# dinocode-w0qv
title: 'Browser tool: dinocode_browser_open / list_tabs / close'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

The foundational tools for tab lifecycle from the agent's side.

## Scope

- `dinocode_browser_open({ projectId, url, reuseExistingTab?: boolean })` → `{ tabId, title, url }`.
- `dinocode_browser_list_tabs({ projectId })` → `{ tabs: [{ tabId, url, title, errorCount, networkCount }] }`.
- `dinocode_browser_close({ tabId })` → `{ ok }`.
- Allowlist applied on `open`.

## Acceptance

- Tools callable from a headless test harness.
- Error codes: `NAVIGATION_BLOCKED`, `TOO_MANY_TABS`, `NOT_FOUND`.
