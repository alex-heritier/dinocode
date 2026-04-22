---
# dinocode-nxcb
title: Board empty-state + onboarding affordance
status: todo
type: task
priority: low
tags:
  - phase-2
  - ui
created_at: 2026-04-22T07:34:35Z
updated_at: 2026-04-22T07:34:35Z
parent: dinocode-lsa5
---

When `.dinocode/` exists but `tasks/` is empty, show a welcoming onboarding state that explains the board and seeds example tasks optionally.

## Subtasks

- [ ] Component `apps/web/src/components/board/BoardEmptyState.tsx`
- [ ] Shown only when 0 tasks exist (post-initialization)
- [ ] Illustration (inline SVG) + short pitch: "Your tasks will appear here"
- [ ] Primary CTA: "Create first task" → opens inline form in Todo column
- [ ] Secondary CTA: "Seed example tasks" → dispatches 3–5 example `task.create` commands (demo content)
- [ ] Tertiary: "Read the guide" → opens DINOCODE.md in editor via `shell.openInEditor`
- [ ] Dismissible, remembered per-project
