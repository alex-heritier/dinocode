---
# dinocode-yr6l
title: "CI guard: flag new @dinocode/* additions to t3code internals"
status: todo
type: task
priority: normal
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T03:39:22Z
---

Add a CI step that parses 'git diff upstream/main..HEAD --stat' and fails if > N lines of change land in apps/_ or packages/contracts/_ for a commit that does not also carry a label or commit-trailer 'Integration: <package>'. Threshold default: 20 lines. Goal: make t3code-internal churn visible at review time. See docs/dinocode-packages.md.
