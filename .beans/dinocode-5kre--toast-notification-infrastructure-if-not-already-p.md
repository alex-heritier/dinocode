---
# dinocode-5kre
title: Toast / notification infrastructure (if not already present)
status: todo
type: task
priority: normal
tags:
    - phase-5
    - ui
created_at: 2026-04-22T07:38:56Z
updated_at: 2026-04-22T07:38:56Z
parent: dinocode-b6x6
---

Several features (unblock, conflict, subtask completion, error states) need a consistent toast system. Audit current codebase and either extend the existing one or introduce one.

## Subtasks

- [ ] Audit `apps/web/src/` for existing toast/snackbar code
- [ ] If absent: introduce `packages/client-runtime/src/toast/` module with React context + imperative `showToast({kind, title, body, actions?, timeoutMs?})`
- [ ] Types: `success`, `info`, `warning`, `error`
- [ ] Stacking: max 5 visible; older ones collapse into a "+N more" pill
- [ ] Actions: primary + secondary buttons inline
- [ ] Dismissible via × or timeout
- [ ] Desktop integration: when app is not focused, mirror critical toasts via `Notification` API (opt-in setting)
- [ ] Accessibility: `role="status"` for info, `role="alert"` for error/warning; `aria-live` regions
- [ ] Tests: stacking, action callbacks, timeout dismissal
