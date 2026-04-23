---
# dinocode-fgw7
title: "Browser: file-upload delegation to native picker"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-1-view
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-ousa
  - dinocode-u1nj
---

## Why this bean exists

Any form with `<input type=file>` needs a working file picker. Electron's default native picker is fine for user-initiated flows. For agent-driven uploads we need a programmatic path (setting files on the input via CDP) without showing UI, otherwise the agent tool-chain hangs on the user gesture.

## Background

CDP's `DOM.setFileInputFiles` sets the input value directly; we expose this via the `fill_form` tool when a field's type is `file`. For user flows the default Electron behaviour is preserved.

## In scope

- User flow: ensure native picker works (regression test).
- Agent flow: `fill_form` with `{ labelOrRef, value: { files: [path, ...] } }` wires `DOM.setFileInputFiles`.
- Path validation: files must exist and be within the project or an explicit allowlist of directories.

## Out of scope

- Drag-and-drop onto arbitrary elements — that's a separate bean if we ever need it.

## Subtasks

- [ ] Implement in `fill_form` handler.
- [ ] Add path validation + tests.
- [ ] Document in tool input schema.

## Dependencies

**Blocked by:**

- `dinocode-ousa` — browser-manager
- `dinocode-u1nj` — cdp-adapter

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- `setFileInputFiles` path-validation rejects `..`, absolute paths outside project, missing files.

### Integration / end-to-end

- Upload a fixture image to a form, assert the POST contains the expected multipart bytes.

### Manual QA script

- Open a test form, click 'choose file', pick an image, verify native dialog + correct preview.

## Logging & observability

- Log every agent-driven file-set with `{ traceId, tabId, field, absolutePath, bytes }` (NOT the file contents).

## Risks & mitigations

- **Agent uploads sensitive files** — Path allowlist limits to the project tree by default; user can opt-in additional roots in settings.

## Acceptance criteria

- [ ] User and agent upload paths both work end-to-end.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
