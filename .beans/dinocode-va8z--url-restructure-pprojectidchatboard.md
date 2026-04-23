---
# dinocode-va8z
title: "URL restructure: /p/$projectId/{chat,board}/..."
status: todo
type: task
priority: low
created_at: 2026-04-23T04:40:28Z
updated_at: 2026-04-23T04:40:28Z
parent: dinocode-qsqf
---

Move the project to the URL root so the "two faces" idea is structural:

- `/p/$projectId/chat/$threadId` (was `/_chat/$env/$thread`)
- `/p/$projectId/board` (was `/_chat/board/$env/$project`)
- `/p/$projectId/board/t/$taskId` (new \u2014 deep link to a card)

## Why defer

- Touches many routes, analytics, deep-link handling, possibly external integrations.
- All of Phase A + B can ship under the current URL shape; the `\u2318\u21e7B` toggle is the functional equivalent.

## Acceptance

- All routes migrated with redirects from old URLs.
- Deep-link to a card loads board + opens its detail sheet.
- Copy-link on card produces the new shape.
