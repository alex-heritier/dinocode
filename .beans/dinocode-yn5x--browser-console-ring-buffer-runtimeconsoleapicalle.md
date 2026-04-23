---
# dinocode-yn5x
title: 'Browser: console ring buffer + Runtime.consoleAPICalled capture'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-2-cdp
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Capture and retain the last N console messages per tab so the agent can fetch them without missing events.

## Scope

- `ConsoleRingBuffer` (default capacity 1000 entries per tab; override via config).
- Captures `Runtime.consoleAPICalled` + maps arg types (strings, numbers, JSON-serializable objects, error stacks).
- Stores `{ ts, level, args, stackTrace, executionContextId }`.
- Stream-emits to renderer (for the drawer in the next bean) and to the server (for agent tool).
- Cursor API: `drain(since: cursor) → { entries, nextCursor }` so the agent can poll without duplicates.

## Acceptance

- Unit tests cover level mapping, arg marshaling (incl. circular references → `[Circular]`), ring eviction.
- Integration test: inject 2k `console.log` calls → most recent 1000 retained.
