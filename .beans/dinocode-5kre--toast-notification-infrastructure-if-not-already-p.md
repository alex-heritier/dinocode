---
# dinocode-5kre
title: Toast / notification infrastructure (if not already present)
status: completed
type: task
priority: normal
tags:
  - phase-5
  - ui
created_at: 2026-04-22T07:38:56Z
updated_at: 2026-04-23T03:08:22Z
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

## Summary of Changes

Audit-only bean. The web app already ships a comprehensive toast system, so no new infrastructure was added.

### Audit findings

- **Existing module**: `apps/web/src/components/ui/toast.tsx` (~720 LoC) + `toast.logic.ts` + `toast.logic.test.ts` + `toastHelpers.ts` using `@base-ui/react/toast`.
- **Types covered**: `error`, `warning`, `success`, `info`, `loading`.
- **Stacking**: `Toast.Viewport` with `buildVisibleToastLayout` controls visible count, scale, peek, and collapsed-content masking (the `+N more` affordance is implicit via stacked visuals).
- **Actions**: `actionProps` + `actionVariant` (default/destructive/destructive-outline/ghost/link/outline/secondary); `actionLayout` of `inline` or `stacked-end`.
- **Dismiss**: corner dismiss button (`toastCornerDismissClass`) + `dismissAfterVisibleMs` (pauses while the tab is hidden/unfocused via `ThreadToastVisibleAutoDismiss`).
- **Thread scoping**: `ScopedThreadRef`-aware filtering (`shouldRenderThreadScopedToast`) so toasts can be restricted to the active thread.
- **Accessibility**: `@base-ui/react/toast` handles `aria-live`, role, and keyboard semantics by default; custom dismiss button has `aria-label`.
- **Two providers**: `ToastProvider` (floating stack) + `AnchoredToastProvider` (anchored to a specific element).
- **Helper API**: `stackedThreadToast({ type, title, description, actionProps, actionVariant, ... })`.

### Missing (deferred)

Only the **desktop-focus Notification API mirror** from the bean's subtask list is not present today. It was factored into a follow-up bean: **dinocode-a768** (low priority).

### Conclusion

No code changes required for this bean. The existing infrastructure meets the audit criteria; new toast-consuming features (conflict, unblock, subtask completion) can use `stackedThreadToast` directly.
