---
# dinocode-dyjh
title: 'Browser: artifact storage conventions (.dinocode/browser/**)'
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

One place, one layout, `.gitignore`'d, and user-discoverable.

## Scope

- Directory layout:
  - `.dinocode/browser/screenshots/<tabId>/<ISO>.png`
  - `.dinocode/browser/network-bodies/<tabId>/<requestId>.<ext>`
  - `.dinocode/browser/dom-snapshots/<tabId>/<ISO>.html`
  - `.dinocode/browser/sessions/<tabId>-<ISO>/manifest.json`
  - `.dinocode/browser/traces/<tabId>/<ISO>.json`
  - `.dinocode/browser/state.json` (tab persistence, Phase 1)
  - `.dinocode/browser/allowlist.json` (Phase 0)
  - `.dinocode/browser/history.json` (Phase 1 address bar)
- `.gitignore` excludes the whole directory.
- "Open browser data folder" action in the browser settings drawer.

## Acceptance

- Gitignore verified.
- A one-line `ArtifactPaths` module exports helpers so no other module hardcodes paths.
