---
# dinocode-07j6
title: 'Browser tool: dinocode_browser_screenshot (viewport / full-page → artifact path)'
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

Capture screenshots for the agent and for session recordings.

## Scope

- `dinocode_browser_screenshot({ tabId, mode?: 'viewport'|'fullPage', selector?: string, format?: 'png'|'jpeg', quality?: number })` → `{ path, width, height, bytes }`.
- Uses `Page.captureScreenshot` with `captureBeyondViewport: true` for full-page.
- Saves to `.dinocode/browser/screenshots/<tabId>/<ISO>.png`; returns repo-relative path.
- Never inlines bytes — path-only response (with a length count).

## Acceptance

- Full-page screenshot of a scrollable doc fits in a single PNG (within Chromium's max image size).
- Selector-scoped screenshots clip to `getBoundingClientRect`.
- Artifact directory respects `.gitignore` (added under `.dinocode/browser/**`).
