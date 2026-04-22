---
# dinocode-tpk6
title: '@mention autocomplete for task references in composer'
status: todo
type: feature
priority: normal
tags:
    - phase-3
    - composer
created_at: 2026-04-22T07:35:30Z
updated_at: 2026-04-22T09:55:27Z
parent: dinocode-0apu
blocked_by:
    - dinocode-vdno
---

Extend the existing `@mention` infrastructure (`apps/web/src/composer-editor-mentions.ts`) to recognize task IDs and titles, providing inline autocomplete when typing `@`.

## Subtasks

### Trigger
- [ ] Keep existing `@` trigger; add a new mention source: `taskSource`
- [ ] Task source is active only when the current thread/project has tasks

### Data
- [ ] Query the board slice of the store — no network round-trip
- [ ] Fuzzy match against `id`, `title`, `tags` (combined, weighted: id 3x, title 2x, tag 1x)
- [ ] Limit to 10 results; sort by match score then `updated_at` desc

### Rendering
- [ ] Row shows: `[dnc-0ajg]` id chip, title, status pill, priority dot
- [ ] Keyboard: ↑/↓ navigate, Enter select, Esc close
- [ ] Mouse: click to select

### Insertion
- [ ] Insert `@dnc-0ajg` token into the message text
- [ ] Side-effect: add `dnc-0ajg` to `threadContextTasks` (creates a chip — see dinocode-vdno)
- [ ] If the user deletes the token, does the chip go with it? Configurable: default "keep chip" (explicit remove)

### Interaction with file/symbol mentions
- [ ] Existing file mentions continue to work; task source appears below file source in the dropdown when both match

### Tests
- [ ] Typing `@oa` shows OAuth-related tasks
- [ ] Typing `@dnc-` shows task IDs
- [ ] Inserting adds both token and chip
