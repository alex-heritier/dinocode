---
# dinocode-bs50
title: 'Browser: multi-tab + tab strip'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-1-view
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Give users a Chrome-like tab strip so they can have several pages open at once.

## Scope

- `TabStrip.tsx` renders one chip per tab with: title, favicon (from `page-favicon-updated`), close button, error badge (from Phase 2).
- `⌘T` new tab, `⌘W` close active, `⌘1..9` jump to tab N, `⌘⇧]`/`⌘⇧[` next/prev.
- Drag-to-reorder (dnd-kit consistent with board).
- Context menu: "Reload", "Duplicate", "Close others", "Close", "Open DevTools".

## Acceptance

- Up to 6 concurrent tabs supported; 7th returns `TOO_MANY_TABS` with a toast "Close a tab to open another".
- Tab reordering persists across reload.
