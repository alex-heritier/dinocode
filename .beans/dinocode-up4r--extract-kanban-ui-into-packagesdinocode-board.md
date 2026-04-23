---
# dinocode-up4r
title: Extract Kanban UI into packages/dinocode-board
status: todo
type: task
priority: high
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T03:39:22Z
---

Move the Kanban board UI out of apps/web and into a new packages/dinocode-board package. Target sources: apps/web/src/components/board/\*, apps/web/src/routes/\_chat.board.$environmentId.$projectId.tsx, apps/web/src/rpc/boardState.ts, and the modifications to apps/web/src/components/ChatView.browser.tsx and apps/web/src/components/KeybindingsToast.browser.tsx. apps/web should re-import via a thin route-adapter module; no dinocode logic lives in apps/web/src/components directly. See docs/dinocode-packages.md.
