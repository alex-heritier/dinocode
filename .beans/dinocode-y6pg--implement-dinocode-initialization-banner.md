---
# dinocode-y6pg
title: Implement .dinocode/ initialization banner
status: todo
type: task
priority: normal
created_at: 2026-04-22T07:14:22Z
updated_at: 2026-04-23T03:41:20Z
parent: dinocode-lsa5
blocked_by:
  - dinocode-9mrx
---

Full-page banner shown by the board route when the selected project has no `.dinocode/config.yml`. One-click initialization.

## Subtasks

- [ ] Component `apps/web/src/components/board/DinocodeInitBanner.tsx`
- [ ] Large heading: "Dinocode isn't set up for this project yet"
- [ ] Subtext: explains what initialization does (create `.dinocode/tasks/`, config, gitignore, etc.)
- [ ] Show preview of files that will be created (tree view, collapsed by default)
- [ ] Primary button: "Initialize Dinocode for this project" → dispatches `project.dinocode.initialize` command
- [ ] Secondary link: "Learn more" → opens `https://github.com/pingdotgg/dinocode` via `shell.openExternal` (desktop) or new tab (web)
- [ ] Loading state while command is dispatched (spinner + disabled button)
- [ ] Success: banner replaced by empty board with toast "Dinocode initialized"
- [ ] Error toast on failure with retry
- [ ] Covers the banner with backdrop; cannot navigate away without dismissing (focus trap)
- [ ] Respect dark/light theme
- [ ] Test: banner appears only when config missing; disappears after successful init

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
