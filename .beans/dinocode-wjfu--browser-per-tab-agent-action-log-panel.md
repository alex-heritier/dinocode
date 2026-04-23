---
# dinocode-wjfu
title: 'Browser: per-tab agent action log panel'
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

Auditable record of everything the agent did in a tab.

## Scope

- Collapsible panel at the bottom of each tab listing the last N agent actions: `{ ts, tool, argsSummary, resultSummary, durationMs, screenshotRefIfAny }`.
- Clickable rows expand to full params + result JSON.
- "Export session" → `.dinocode/browser/sessions/<tabId>-<ISO>.jsonl` (consumed by the recording bean).

## Acceptance

- Log persists for the life of the tab.
- Log size capped (1000 entries); older entries dropped with a marker.
