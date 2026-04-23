---
# dinocode-2lh1
title: "Browser: download handling + artifact routing"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
  - security
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-ctrl
  - dinocode-dyjh
---

## Why this bean exists

Web apps routinely trigger downloads (exports, PDFs, bundle builds). If we don't handle `will-download` the user either gets a native download dialog in an unexpected place or the download silently fails. A proper download policy also gives the agent a tool to retrieve files a page produced during a session (e.g. 'export the CSV, then open it').

## Background

Electron's `session.on('will-download', ...)` gives us full control over where downloads go, whether to prompt, and completion state. We default downloads for agent-driven navigations to `.dinocode/browser/downloads/<tabId>/` (discoverable, gitignored). User-initiated downloads still show the native save dialog. We also expose a `dinocode_browser_list_downloads` tool.

## In scope

- `DownloadManager` in main process registering `will-download` per partition.
- User-initiated (from the address bar or a page click) → native save dialog.
- Agent-initiated (tool-driven click that triggers a download) → auto-save to `.dinocode/browser/downloads/<tabId>/<timestamp>-<filename>` and return the path from the click tool's result.
- `dinocode_browser_list_downloads({ tabId?, sinceTs? })` → structured list.
- Downloads UI: small in-panel drawer showing progress bars, cancel buttons.
- Clean up downloads older than 7 days via a housekeeping job.

## Out of scope

- Virus scanning of downloaded files.
- Bandwidth throttling.

## Subtasks

- [ ] Implement `DownloadManager` + tests.
- [ ] Wire drawer + progress UI.
- [ ] Add `dinocode_browser_list_downloads` tool + tests.
- [ ] Housekeeping job.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-ctrl` — session-partition
- `dinocode-dyjh` — artifact-storage

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `downloadManager.test.ts` — routing decision (user vs agent); path sanitisation; filename collision handling.

### Integration / end-to-end

- Trigger a download from a fixture page; assert file appears in the expected directory with expected bytes.
- Cancel mid-download; assert partial file is cleaned up.

### Manual QA script

- Navigate to a test page that downloads a 5 MiB file; watch the drawer progress bar.

## Logging & observability

- Log every download with `{ traceId, tabId, source:'user'|'agent', url, savePath, bytes, durationMs, status }`.

## Risks & mitigations

- **Path traversal in filenames** — Sanitise via `path.basename` + disallow `..`; test with malicious fixture.

## Acceptance criteria

- [ ] Agent click that triggers a download receives the resulting file path in its tool response.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
