---
# dinocode-qsqf
title: Delightful kanban \u2194 chat UX
status: in-progress
type: feature
priority: high
created_at: 2026-04-23T04:38:02Z
updated_at: 2026-04-23T04:38:02Z
---

Make the kanban board feel native to the chat experience so it gets daily use. The north star: **one project, two faces** — a Dinocode project has a conversation face (threads) and a planning face (board), and moving between them should feel like flipping a card over.

See `docs/dinocode-packages.md` for architectural constraints: new code lives in `packages/dinocode-board` (or a light integration layer in `apps/web`), not deeply coupled into t3code internals.

## Design doc (source of truth)

Full proposal logged in chat transcript `add4bf7d-0ff6-4ab2-8e84-996abca1b22b`. Summary:

1. **Mental model**: One project, two faces. Every task can be a thread; every thread can be filed as a task.
2. **Navigation**: Sidebar shows Chat/Board pill per project; `ChatHeader` project badge opens board; `⌘⇧B` toggles faces.
3. **Card = unit of work**: right-side slide-over (not modal) with Start Session (`⌘⏎`), Open File, bound threads, blockers.
4. **Composer bridges**: `/task` slash command, `@TASK-` mention chips, "File as task" on selection.
5. **Thread memory**: thread bound to a task shows a chip in header; sidebar marks task-bound threads.
6. **Command palette**: Tasks + Faces groups.
7. **Fast create**: press `c` on board, or `+` on column, for zero-friction jotting.
8. **Empty state**: opinionated copy that teaches "tasks are files in your repo."

## Child beans (incremental build order)

Phase A — unlock the chat↔board loop:
- Sidebar Chat/Board pill
- `⌘⇧B` toggle face
- `ChatHeader` project badge → board switcher
- Task Detail slide-over + Start Session + Open File

Phase B — make the bridge bidirectional:
- `/task` composer slash command
- `@TASK-` mention chip
- Thread ↔ task binding + chat-header chip

Phase C — polish + power-user:
- Fast-create (`c`, column `+`)
- Command palette Tasks/Faces groups
- Opinionated empty state + drop preview + auto-scroll + hover peek

Later:
- URL restructure to `/p/$projectId/...`
- Dependency-graph filter mode

## Acceptance

- All child beans shipped, each with its own verification.
- Documented keyboard shortcuts visible in the command palette.
- `bun fmt`, `bun lint`, `bun typecheck`, `bun run test` green after each phase.
