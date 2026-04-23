---
# dinocode-a768
title: 'Toast: desktop Notification API mirror for critical toasts'
status: completed
type: feature
priority: low
created_at: 2026-04-23T03:08:06Z
updated_at: 2026-04-23T03:17:19Z
---

Follow-up to dinocode-5kre audit: when the app is not focused, mirror critical (error/warning) toasts to the system Notification API. Opt-in setting. Should wrap toastManager in apps/web/src/components/ui/toast.tsx and call new Notification(...) when document.hasFocus() is false and the toast type is error/warning.



## Implementation

- Added `criticalToastDesktopNotifications: boolean` to `ClientSettingsSchema` + `ClientSettingsPatch` in `packages/contracts/src/settings.ts` (default `false`).
- Extended `stackedThreadToast` in `apps/web/src/components/ui/toastHelpers.ts` with a fire-and-forget `maybeMirrorToSystemNotification` that:
  - only fires for `error` / `warning` types
  - only when `document.hasFocus() === false`
  - only when the client setting is on
  - requests the `Notification` permission lazily, caches permission, never re-prompts
  - flattens React titles/descriptions to plain strings safely, handling arrays and nested children
  - passes `requireInteraction` for errors, `silent` for warnings, and a stable `tag` so duplicate alerts collapse in the OS notification center
  - has opt-out per-toast via `mirrorToSystemNotification: false`
- Added a "Desktop notifications for critical toasts" row to `SettingsPanels.tsx` with dirty-state integration.
- Updated fixtures in `apps/desktop/src/clientPersistence.test.ts` and `apps/web/src/localApi.test.ts` for the new schema field.

## Verification

- `bun fmt`: ok
- `bun lint`: 0 errors (15 pre-existing warnings)
- `bun typecheck`: ok (all 11 packages)
- `bun run test`: 883 passed / 4 skipped across 97 test files
