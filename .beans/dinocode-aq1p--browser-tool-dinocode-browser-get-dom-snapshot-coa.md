---
# dinocode-aq1p
title: 'Browser tool: dinocode_browser_get_dom_snapshot (coarse, opt-in)'
status: todo
type: task
priority: normal
tags:
    - phase-browser
    - phase-4-agent-interact
created_at: 2026-04-23T05:14:24Z
updated_at: 2026-04-23T05:14:24Z
parent: dinocode-ipdj
---

Full DOM dump for deep debugging. Rarely used; opt-in because it's heavy.

## Scope

- `dinocode_browser_get_dom_snapshot({ tabId, includeStyles?: boolean, selector?: string })` → `{ html | artifact path }`.
- Prefer the accessibility tree in normal operation; this is for when the agent needs to see the raw HTML (e.g., diagnosing a hydration mismatch).
- If HTML > 200 KiB, writes to `.dinocode/browser/dom-snapshots/<tabId>/<ISO>.html` and returns a path.

## Acceptance

- Size threshold respected.
- Warning in tool description: "Prefer `get_accessibility_tree` unless you specifically need raw HTML".
