---
# dinocode-zxya
title: "Command palette: Tasks + Faces groups"
status: todo
type: task
priority: normal
created_at: 2026-04-23T04:40:07Z
updated_at: 2026-04-23T04:40:07Z
parent: dinocode-qsqf
---

Expose the two most-used cross-cutting actions through the existing `CommandPalette`:

## Tasks group

- When a project is active, shows top 10 open tasks from that project, fuzzy-filterable by title or ID.
- `Enter` on a task \u2192 opens detail slide-over (even from chat view).
- `\u2318\u23ce` \u2192 Start Session.
- `\u21e7\u23ce` \u2192 insert `@TASK-<id>` into the currently-focused composer (no-op if none).

## Faces group

- "Switch to Board" (`\u2318\u21e7B`)
- "Switch to Chat" (`\u2318\u21e7B`)
- "Open project picker" \u2014 jumps to `/board` index.

## Implementation

- Extend `CommandPalette.logic.ts` to register the two groups via the existing group registration pattern.
- Tasks group data source: pull from the current board subscription if one is active, otherwise lazy-subscribe on palette open.

## Acceptance

- Opening the palette from chat shows Faces + Tasks groups.
- Tasks group filters to project in scope.
- Keyboard modifiers work as above.
