---
# dinocode-3j2h
title: 'Browser: architecture & design doc (docs/dinocode-browser.md)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
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
