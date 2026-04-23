---
# dinocode-a768
title: 'Toast: desktop Notification API mirror for critical toasts'
status: todo
type: feature
priority: low
created_at: 2026-04-23T03:08:06Z
updated_at: 2026-04-23T03:08:06Z
---

Follow-up to dinocode-5kre audit: when the app is not focused, mirror critical (error/warning) toasts to the system Notification API. Opt-in setting. Should wrap toastManager in apps/web/src/components/ui/toast.tsx and call new Notification(...) when document.hasFocus() is false and the toast type is error/warning.
