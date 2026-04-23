---
# dinocode-dc75
title: Accessibility audit + fixes for kanban, detail panel, composer, home agent
status: todo
type: feature
priority: normal
tags:
  - a11y
created_at: 2026-04-22T07:41:24Z
updated_at: 2026-04-23T03:41:21Z
parent: dinocode-xd5m
---

Ship Dinocode WCAG 2.1 AA compliant. Audit every new surface, fix failures, add axe-core automated checks to CI.

## Subtasks

### Tooling

- [ ] Integrate `@axe-core/playwright` into the E2E suite
- [ ] Fail CI on new accessibility violations (baseline snapshot for existing issues)

### Kanban board

- [ ] Full keyboard navigation (see dinocode-nfw2)
- [ ] `aria-roledescription` on cards as "draggable task"
- [ ] `aria-grabbed`/`aria-dropeffect` polyfilled via `@dnd-kit/accessibility`
- [ ] Screen reader announcements on drag: "Task 'Foo' moved from Todo to In Progress"
- [ ] Color is never the only cue (priority uses pill + icon + color)
- [ ] Focus visible ring on all interactive elements (3:1 contrast)

### Detail panel

- [ ] Focus trap while open
- [ ] Restore focus to originating card on close
- [ ] `aria-modal="true"`, `aria-labelledby` points to title

### Forms

- [ ] All inputs have associated `<label>`
- [ ] Error messages announced via `aria-describedby` with `role="alert"`

### Home agent

- [ ] Live region announces new assistant messages
- [ ] Keyboard shortcut to focus input

### Docs

- [ ] Add an "Accessibility" section to DINOCODE.md with supported screen readers + versions

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/web/src/`. Target: `packages/dinocode-board` (new; tracked by dinocode-up4r). `apps/web` gets a route-adapter import with a `dinocode-integration:` comment. No dinocode-specific fields added to t3code `ClientSettings`; use `.dinocode/config.yml` or a `dinocode.*`-prefixed localStorage key instead. Update acceptance criteria and file paths before picking this up.
