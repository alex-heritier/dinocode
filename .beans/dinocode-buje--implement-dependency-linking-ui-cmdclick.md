---
# dinocode-buje
title: Implement dependency linking UI (Cmd+click)
status: todo
type: feature
priority: normal
created_at: 2026-04-22T07:15:35Z
updated_at: 2026-04-22T07:38:07Z
parent: dinocode-b6x6
---

Cmd/Ctrl+click a source card enters link-draft mode; subsequent click on a target card dispatches `task.link`. Visual affordance (highlighted targets, SVG edge preview) guides the user.

## Subtasks

### State machine
- [ ] `board.linkDraft: { sourceTaskId: TaskId } | null` in store
- [ ] `Cmd/Ctrl+click` on card while no draft → set draft, change cursor to crosshair
- [ ] Click on another card while draft active → dispatch `task.link({ fromTaskId, toTaskId })`
- [ ] Click on same card / anywhere else → cancel draft
- [ ] `Esc` cancels
- [ ] Draft times out after 30s (visual countdown)

### Visual affordances
- [ ] Source card pulses subtly (animated border)
- [ ] All potential targets (non-source cards) get a faint "+link" overlay on hover
- [ ] Invalid targets (would create cycle, already linked, self) get a "forbidden" cursor and tooltip
- [ ] While dragging, draw a live Bezier from source center to mouse pointer (reuses DependencyOverlay machinery from dinocode-b3nv)

### Cycle detection
- [ ] Client-side: walk existing `blocking` graph; if target reachable from source, reject with toast "Would create a cycle"
- [ ] Server-side: decider also rejects cycles as a safety net
- [ ] Cycle explanation toast lists the cycle path

### Accessibility
- [ ] Keyboard alternative: select card → press `L` → enters link mode; arrow keys pick target; Enter confirms
- [ ] Announce state changes via `aria-live` region

### Tests
- [ ] Happy path: link two unrelated tasks
- [ ] Cycle rejection with 3-task cycle
- [ ] Keyboard-only flow
