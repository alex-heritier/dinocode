---
# dinocode-jzfg
title: 'Browser: auto-open preview on Start Session for ui/frontend tasks'
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

Close the loop from kanban → agent thread → live preview.

## Scope

- When the Start Session action fires from `TaskDetailSheet` (dinocode-xjal) for a task tagged `ui`, `frontend`, or `web`, also open the browser face with the detected dev-server URL.
- User setting: "Auto-open preview for UI tasks" (default on).
- No-op when dev server is undetected or user disabled the setting.

## Acceptance

- Pressing Start Session on a `ui`-tagged task opens both the chat thread AND the browser face with the preview URL.
- Unit test for the decision function.
