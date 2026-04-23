---
# dinocode-c3lk
title: 'Browser tool: dinocode_browser_get_console (drain since cursor)'
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

Expose the console ring buffer to the agent without duplicate delivery.

## Scope

- `dinocode_browser_get_console({ tabId, since?: cursor, level?: 'log'|'warn'|'error'|'any', limit?: number })` → `{ entries, nextCursor }`.
- Entries are the normalized `{ ts, level, text, stackTrace? }` from the ring buffer.
- Default limit 200, max 500.

## Acceptance

- Agent can call repeatedly with `since` to paginate.
- Level filtering works.
