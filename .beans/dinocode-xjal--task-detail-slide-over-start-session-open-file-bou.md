---
# dinocode-xjal
title: "Task detail slide-over: Start Session + Open File + bound threads"
status: done
type: task
priority: high
created_at: 2026-04-23T04:39:00Z
updated_at: 2026-04-23T04:58:00Z
parent: dinocode-qsqf
---

## Outcome (2026-04-23)

Initial slice landed:

- New component `apps/web/src/components/board/TaskDetailSheet.tsx` renders the detail as a right-side sheet via `Sheet`/`SheetPopup` from `@base-ui/react/dialog`.
- Board route (`apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx`) replaced the previous centered modal with `TaskDetailSheet`.
- Actions wired: **Start session** (creates a new thread for the project via `useNewThreadHandler`), **Open folder** / **Copy path** (project `cwd`, since `api.shell.openInEditor` is directory-only), **Delete**.
- Threads section + body rendering deferred to follow-up beans (dinocode-h41x, dinocode-skse); placeholder copy shown today.
- `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.

---

Replace the current centered-modal card detail with a right-side slide-over sheet that matches the existing `DiffPanelShell` aesthetic. This is the primary action surface for a card.

## Design

Right-edge sheet, `w-[28rem]`, backdrop not darkened (board stays visible).

Contents:

```
TASK \u00b7 <status>
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
<taskId> \u2014 <title>
status  priority  type

Body (markdown rendered)

Blocked by: \u2026 (clickable)
Blocks:     \u2026 (clickable)

\u2500\u2500 Threads (N) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
<thread rows with \u2197 link>

\u2500\u2500 Actions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
[ Start session \u2318\u23ce ]  [ Open file \u2318O ]  [ Copy ID ]
[ Archive ]  [ Delete ]
```

Behavior:

- Sheet does NOT block the board (no dark overlay); close on outside click or Esc.
- `\u2318\u23ce` from anywhere in the sheet triggers Start Session (dinocode-skse).
- `\u2318O` reveals `.dinocode/tasks/<id>--<slug>.md` via existing `OpenInPicker` flow (if editor available).
- `j/k` on the board shifts card focus; `Enter` opens this sheet for the focused card.
- "Blocked by" and "Blocks" render inline chips with status dot.
- Threads section defers to dinocode-h41x (thread \u2194 task binding); until that ships, show `No threads yet` placeholder.

## Implementation

- New component `apps/web/src/components/board/TaskDetailSheet.tsx`.
- Replace the modal in `apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx` with this component.
- Keep the logic in `apps/web/src/components/board/` so it can be lifted to `packages/dinocode-board` later.

## Acceptance

- Click a card \u2192 slide-over appears from the right with full card data.
- Outside click / Esc closes. Board remains interactive behind the sheet (hover cards still work).
- Delete, Archive, Copy ID, Open File all functional (or disabled with tooltip when unavailable).
- Start Session button triggers the command defined in dinocode-skse.
- Keyboard navigation on board (`j/k`, `Enter`, `Esc`) works.
- `bun fmt && bun lint && bun typecheck && bun run test` green.
