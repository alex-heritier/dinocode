---
# dinocode-1mfa
title: 'Browser: task ↔ browser session binding'
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

Tie recorded browser sessions to tasks so agents and users can retrieve "the browser session where I reproduced this bug".

## Scope

- When recording is active and a task is in focus (from `TaskDetailSheet` or the active thread's bound task — dinocode-h41x), write `taskId` into the session manifest.
- New tool: `dinocode_browser_list_sessions_for_task({ taskId })`.
- Task detail sheet gets a "Browser sessions (N)" section listing recordings bound to it, with thumbnails.

## Acceptance

- Recorded sessions discoverable from the task's detail sheet.
- Agent tool returns session list + summary metadata.
