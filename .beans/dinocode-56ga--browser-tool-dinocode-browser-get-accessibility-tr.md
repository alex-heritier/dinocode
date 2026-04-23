---
# dinocode-56ga
title: 'Browser tool: dinocode_browser_get_accessibility_tree (semantic snapshot)'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-3-agent-read
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

The primary structural snapshot tool for the agent — accessibility trees are orders of magnitude cheaper than raw DOM and semantically richer.

## Scope

- `dinocode_browser_get_accessibility_tree({ tabId, selector?: string, maxDepth?: number })` → `{ tree: AxNode }`.
- Uses `Accessibility.getFullAXTree` (or `getAXNodeAndAncestors` for scoped).
- Nodes include `{ role, name, value, description, focusable, focused, children, refId }`.
- `refId` is a stable opaque handle the agent can feed to `click`/`type` (like Playwright snapshots).
- Snapshot cache invalidates on DOM mutation; agent receives a fresh tree for structural actions.

## Acceptance

- Tree for https://example.com fits in <5KB JSON.
- Refs resolve successfully in interaction tools (Phase 4).
- Unit tests for tree normalization.
