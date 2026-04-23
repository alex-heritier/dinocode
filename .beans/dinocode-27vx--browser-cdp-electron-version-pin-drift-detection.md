---
# dinocode-27vx
title: "Browser: CDP / Electron version pin + drift detection"
status: todo
type: task
priority: normal
tags:
  - phase-browser
  - phase-7-later
  - reliability
created_at: 2026-04-23T05:46:23Z
updated_at: 2026-04-23T05:46:35Z
parent: dinocode-ipdj
blocked_by:
  - dinocode-u1nj
  - dinocode-jtbw
---

## Why this bean exists

CDP evolves. An Electron upgrade can silently remove a CDP method we depend on. We lock expected CDP method availability in a machine-checked manifest and fail CI if we drift.

## Background

Ship a `cdp-manifest.json` listing every CDP method + domain we use. At test time, enumerate `Schema.getDomains` + `Method` availability and diff.

## In scope

- Manifest + drift test + docs.

## Out of scope

- Patching Electron.

## Subtasks

- [ ] Manifest + test + CI step.

## Dependencies

**Blocked by:**

- `dinocode-u1nj` — cdp-adapter
- `dinocode-jtbw` — cdp-spike

**Blocks:**

- _None._

**Related:**

- _None._

## Testing

### Unit tests

- Parser correctness.

### Integration / end-to-end

- Stub Electron upgrade; assert drift test fails loudly.

### Manual QA script

- Upgrade Electron minor; run test; triage.

## Logging & observability

- Log drift detection results on every startup in dev.

## Risks & mitigations

- _None identified beyond the general risks captured in the epic._

## Acceptance criteria

- [ ] Drift test in CI blocks merges that break compat.
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` stay green across the monorepo.
- [ ] No new imports of `apps/**` or `@t3tools/**` internals from `packages/dinocode-browser`; integration wires use `// dinocode-integration: browser ...` comments.
- [ ] Structured logs emitted by this bean's code surface under `DINOCODE_BROWSER_DEBUG=1` with the shared trace-id from `dinocode-log-policy`.

---

Part of epic `dinocode-ipdj`. Architecture context lives in `docs/dinocode-browser.md` (authored under `dinocode-3j2h`).
