---
# dinocode-ctrl
title: 'Browser: per-project session partition (cookies/storage isolation)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Prevent cross-project cookie/localStorage/cache leakage.

## Scope

- Each project gets a persistent Electron partition: `persist:dinocode-project:<projectId>`.
- A "Clear browser data for this project" action in the browser settings drawer.
- A test that logs into a fake service in project A, switches to project B, verifies not logged in.

## Acceptance

- Cookies, localStorage, IndexedDB, and service workers all isolated per project.
- Switching projects does not require reopening tabs.
- Manual QA script documented in `docs/dinocode-browser.md`.
