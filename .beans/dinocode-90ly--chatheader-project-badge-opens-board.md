---
# dinocode-90ly
title: 'ChatHeader: project badge opens board'
status: completed
type: task
priority: high
created_at: 2026-04-23T04:38:40Z
updated_at: 2026-04-23T04:52:47Z
parent: dinocode-qsqf
---

Turn the existing project `<Badge>` in `apps/web/src/components/chat/ChatHeader.tsx` into a lightweight switcher that includes a "Open board" action.

## Design

- Hover/click on the badge reveals a small menu: "Open board (⌘⇧B)", "Show in sidebar", "Copy path".
- Single-click the badge on mac-style UI = open menu; click "Open board" item navigates to `/board/$env/$project`.
- Also OK: dual-action badge — left part = menu trigger, right arrow icon = direct board link.
- Match existing Base-UI `Popover`/`Menu` idioms used elsewhere in `ChatHeader`.

## Implementation

- The badge already has `activeProjectName`; we also need `activeThreadEnvironmentId` and the project id. Pass `activeProjectId` through `ChatHeaderProps` from `ChatView`.
- Minimal wrapper component `apps/web/src/components/chat/ProjectBadgeMenu.tsx` so the hot path stays clean.
- Board link uses `<Link to="/board/$environmentId/$projectId" params={...}>`.
- Symmetrically update the board route header (`_chat.board.$environmentId.$projectId.tsx`) to include a "Chat: last thread" link that mirrors this.

## Acceptance

- Clicking the badge reveals the menu within 50ms.
- "Open board" item navigates correctly.
- Works when the thread has no project bound (menu hidden, or badge absent as today).
- No regression on narrow viewport (badge still truncates + menu still openable).
