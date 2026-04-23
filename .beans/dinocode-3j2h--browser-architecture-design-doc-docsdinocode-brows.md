---
# dinocode-3j2h
title: "Browser: architecture & design doc (docs/dinocode-browser.md)"
status: completed
type: task
priority: high
tags:
  - phase-browser
  - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T06:07:37Z
parent: dinocode-ipdj
---

Write an architecture doc covering the full browser subsystem so every subsequent bean has a shared spine.

## Contents

- High-level diagram (main ↔ preload ↔ renderer ↔ CDP ↔ agent tools ↔ server).
- Electron `WebContentsView` vs `<webview>` vs `<iframe>`: rationale for `WebContentsView`.
- CDP domains we depend on (Runtime, Page, DOM, Accessibility, Network, Target).
- Per-project session partitions (`session.fromPartition("dinocode-project:<id>")`) and cookie scoping.
- Allowlist model (default = localhost + explicit project config).
- Tab lifecycle (create/close, crash, persistence).
- Artifact storage layout under `.dinocode/browser/{sessions,screenshots,traces}/`.
- Agent-tool error taxonomy: `NAVIGATION_BLOCKED`, `TAB_CRASHED`, `EVALUATE_ERROR`, `TIMEOUT`, `NOT_FOUND`, `PERMISSION_DENIED`, `INTERNAL`.
- Open questions: CDP multi-client coordination when user opens DevTools; layout-flicker mitigation.

## Acceptance

- `docs/dinocode-browser.md` exists, referenced from `docs/dinocode-packages.md` and `DINOCODE.md`.
- Diagrams rendered as ASCII or mermaid (no external deps).
- All subsequent Phase 0–7 beans reference sections of this doc for their contract.

---

## Why this bean exists (epic context)

The architecture doc is the single spine every other bean references. It resolves design-time ambiguity (WebContentsView vs webview, CDP multi-client, partition strategy, artifact layout) before any code is written, and it is the place we record 'verified assumptions' from the CDP spike.

## Dependencies

**Blocked by:**

- _None._

**Blocks:**

- `dinocode-r4ns`
- `dinocode-cnnp`
- `dinocode-sdqj`
- `dinocode-gepm`
- `dinocode-jtbw`

**Related:**

- `dinocode-yaan`

## Testing

### Unit tests

- No code yet — the doc itself is the artifact.

### Integration / end-to-end

- Cross-reference check: every subsequent bean in the epic cites at least one section of this doc in its body.

### Manual QA

- Doc lints cleanly (markdownlint).
- Diagrams render correctly on GitHub and in Obsidian.

## Logging & observability

- Use the shared `logger.child({ component: '<bean-file>', traceId })` helper from `dinocode-log-policy`.
- Every externally-triggered action (tool call, user gesture, IPC boundary) emits one log line with `{ ts, level, component, traceId, phase, data? }`.
- Failing paths log at `error`; normal-but-notable at `info`; high-frequency internal events at `debug` or `trace`.
- Secrets (cookies, auth headers, file contents) are passed through `redact()` before logging.
- With `DINOCODE_BROWSER_DEBUG=debug` the test harness stores the log stream with the run artifacts.

## Risks & mitigations

- **Doc bitrot as implementation evolves** — Every PR that touches `packages/dinocode-browser` is required to touch the doc too (enforced by a CODEOWNERS-style reminder).

## Acceptance criteria (superset)

- [ ] Sections: Overview, Processes, CDP, Partitions, Allowlist, Artifacts, Error taxonomy, Open questions.
- [ ] Linked from `docs/dinocode-packages.md` and `DINOCODE.md`.
- [ ] All changes live in `packages/dinocode-browser` (zero t3code-internal rewrites).
- [ ] `bun fmt && bun lint && bun typecheck && bun run test` green across the monorepo.
- [ ] Integration points use `// dinocode-integration: browser ...` one-liner comments.
- [ ] Logs and traces verified under `DINOCODE_BROWSER_DEBUG=debug`.

Part of epic `dinocode-ipdj`.

## Summary of Changes

Created `docs/dinocode-browser.md` as the architecture and design spine for the entire built-in browser epic. The doc covers:

1. Overview + principles (artifacts as paths, one process surface, fork rule).
2. High-level process/IPC diagram.
3. Main, renderer, preload, server surfaces (package-first layout).
4. Why `WebContentsView` (with comparison vs `<webview>` and `<iframe>`).
5. CDP domain matrix (Runtime, Page, DOM, Accessibility, Network, Target, Input, Log) with consumer → domain mapping, plus multi-client coordination and auto-reattach policy.
6. Per-project session partitions with cookie/storage isolation.
7. Allowlist + navigation policy (deny-by-default for agent, allow for user + localhost).
8. Tab lifecycle (open → running → close, crash, persistence).
9. Artifact storage layout under `.dinocode/browser/{sessions,screenshots,pdfs,traces,recordings,dom-snapshots,logs,downloads}/`.
10. Agent tool surface: Phase-3 read tools + Phase-4 interaction tools tabled against their owning beans, plus the full error taxonomy (`NAVIGATION_BLOCKED`, `TAB_CRASHED`, `EVALUATE_ERROR`, `TIMEOUT`, `NOT_FOUND`, `NOT_INTERACTABLE`, `USER_ACTIVE`, `PERMISSION_DENIED`, `RATE_LIMITED`, `TOO_MANY_TABS`, `INTERNAL`) and retry policy.
11. User UX surfaces (keybinding, address bar, DevTools, tab strip, preview button, agent-is-driving banner).
12. Logging & observability (shared `Logger`, JSON lines, redaction, trace ids).
13. Testing strategy (unit / integration / phase e2e suites, 10-run-green CI gate).
14. Feature flag `features.builtInBrowser`.
15. Integration-point surface (where `dinocode-integration:` comments will live in `apps/*`).
16. Open questions (CDP `Fetch.enable`, layout flicker, Electron upgrade drift, enterprise proxy, self-signed certs).
17. Risks & mitigations table linking each risk to an owning bean.
18. Change-control rule (browser-package PRs must touch this doc).

Cross-references added:

- `docs/dinocode-packages.md` — `Related` section now links to the browser doc.
- `DINOCODE.md` §13.1 — new section summarizing the subsystem and pointing at `docs/dinocode-browser.md`.

## Verification

- `bun fmt` green (file is markdown but format pass covers it).
- Doc is pure Markdown with ASCII diagrams (no external deps).
- Every section named in the bean body is present; every Phase 0–7 bean can now cite it.
