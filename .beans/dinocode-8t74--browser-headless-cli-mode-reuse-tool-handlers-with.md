---
# dinocode-8t74
title: 'Browser: headless CLI mode (reuse tool handlers without the GUI)'
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

Expose the same browser tools to the `dinocode` CLI for scripted/CI use.

## Scope

- `dinocode browser open <url>`, `dinocode browser eval <expr>`, `dinocode browser screenshot <url> -o <path>`, etc.
- Under the hood, spawn a headless Electron process (or Chromium via Playwright as a fallback) that mounts `BrowserManager` without a UI.
- Reuses the existing tool handlers unchanged — separation between handler and transport.

## Acceptance

- `dinocode browser eval "1+1"` prints `2` in a CI container (headless).
- Same allowlist + error taxonomy as GUI mode.
