---
# dinocode-wih3
title: FileStore error taxonomy + user-facing messages
status: scrapped
type: task
priority: normal
tags:
  - phase-1
  - errors
created_at: 2026-04-22T07:32:33Z
updated_at: 2026-04-22T12:49:22Z
parent: dinocode-x8dw
---

Define the complete `FileStoreError` tagged union so every failure mode has a stable discriminator the UI can render and the observability stack can aggregate.

## Subtasks

- [ ] Define `FileStoreError` tagged union in `apps/server/src/fileStore/Errors.ts` using `Schema.TaggedErrorClass`
- [ ] Variants: `FileStoreIoError`, `FileStoreParseError` (with file path + parser message), `FileStoreEtagMismatchError`, `FileStoreConfigError`, `FileStoreWatcherError`, `FileStorePathSafetyError` (path escapes workspace root), `FileStoreDuplicateIdError`
- [ ] Each variant carries enough context for the UI to render an actionable message
- [ ] Map each to a toast/notification template in `apps/web/src/lib/fileStoreErrorMessages.ts`
- [ ] Log each variant with a stable `errorCode` for dashboards (e.g. `fs.parse`, `fs.etag`)
- [ ] Unit tests: every tagged variant round-trips through `Schema.decodeUnknown`

## Reasons for Scrapping

Superseded by `dinocode-bv5n` (`Soil error taxonomy`). Error-type definition now lives in Soil; any server or UI-specific message mapping should happen as implementation details of the server adapter rather than as a separate planning bean.
