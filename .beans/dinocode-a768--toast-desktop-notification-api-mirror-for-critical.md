---
# dinocode-a768
title: "Toast: desktop Notification API mirror for critical toasts"
status: todo
type: feature
priority: low
created_at: 2026-04-23T03:08:06Z
updated_at: 2026-04-23T03:37:44Z
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

## 2026-04-23 — reverted, re-scoped

The initial implementation landed as commit `b765b58e`, which modified t3code's `ClientSettings` schema (`packages/contracts/src/settings.ts`), t3code's toast helper (`apps/web/src/components/ui/toastHelpers.ts`), and t3code's settings panel (`apps/web/src/components/settings/SettingsPanels.tsx`). That direction was wrong: this is a generic UX feature unrelated to soil/kanban, and it adds dinocode-specific fields to t3code's contract layer.

Reverted in commit following (see below). Re-implementation must come from a Dinocode-owned package without mutating t3code's ClientSettings. Options on the table:

1. **Upstream it to t3code** — this is a sensible t3code feature; contribute it back instead of forking.
2. **Dinocode plugin package (`packages/dinocode-toast-extensions`)** — a small plugin that wraps t3code's toast manager and adds the notification behavior, with its own client-side setting stored in localStorage (not in t3code's ClientSettings).
3. **Drop it** — low priority; not required for v0.1.

Leaning toward option 1 or 3. Do not re-implement without deciding.
