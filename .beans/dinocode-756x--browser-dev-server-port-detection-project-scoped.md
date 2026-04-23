---
# dinocode-756x
title: 'Browser: dev-server port detection (project-scoped)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-6-project
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Make "open the preview" zero-config for most project layouts.

## Scope

- Detectors (in priority order):
  1. `.dinocode/config.yml → browser.devServerUrl`.
  2. `package.json → dinocode.browser.devServerUrl`.
  3. Sniff `package.json` scripts for `vite`, `next dev`, `bun dev`, `astro dev`, `remix dev`, `rails server` and map to default ports.
  4. Scan running local processes for LISTEN sockets on 3000/3001/5173/4321/8080 and probe HTTP.
- Returns `{ url, confidence, source }`.
- Manual override field in project settings.

## Acceptance

- Detector works on a Vite React app with no config (5173 sniffed).
- Wrong guesses surface as "confidence: low" and require user confirm before auto-opening.
