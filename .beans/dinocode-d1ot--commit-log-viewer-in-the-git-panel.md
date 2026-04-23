---
# dinocode-d1ot
title: Commit log viewer in the git panel
status: todo
type: feature
priority: low
created_at: 2026-04-23T03:19:38Z
updated_at: 2026-04-23T03:41:29Z
---

Show a scrollable commit log for the current branch with commit diff on click. Audit source: docs/codex-monitor-parity-audit.md.

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this parity feature is a **t3code feature**, not a Dinocode feature. The Dinocode direction is to keep t3code internals pristine and layer Dinocode features as packages. Three options for this bean:

1. **Upstream it** — open a PR against `pingdotgg/t3code` instead of committing inline here.
2. **Defer** — park until we decide the feature matters enough to accept the fork-internal change.
3. **Drop** — scrap if the feature isn't critical.

Default is option 1 (upstream). Update before starting work.
