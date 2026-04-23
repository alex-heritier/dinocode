---
# dinocode-rfz5
title: 'Browser: session recording + replay'
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

Record an agent's session (or a user's debugging session) so it can be replayed and embedded in a task.

## Scope

- Start/stop recording from the panel or via `dinocode_browser_record({ tabId, action: 'start'|'stop' })`.
- Recording captures: every action (agent + user), DOM snapshots every N seconds, console + network deltas, screenshots on significant events.
- Stored as `.dinocode/browser/sessions/<tabId>-<ISO>/` with `manifest.json` + per-event files.
- Replayer renders the session as an interactive timeline (out of scope for this bean beyond storage format; replayer viewer is a follow-up).

## Acceptance

- Format documented in `docs/dinocode-browser.md`.
- Size-capped to 200 MiB per session with graceful stop-on-cap.
