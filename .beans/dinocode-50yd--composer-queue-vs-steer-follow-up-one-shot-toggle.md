---
# dinocode-50yd
title: "Composer: Queue vs Steer follow-up + one-shot toggle"
status: todo
type: feature
priority: normal
created_at: 2026-04-23T03:19:38Z
updated_at: 2026-04-23T03:41:29Z
---

Match CodexMonitor composer behavior: let users choose whether pressing Enter while a turn is running queues the message or steers the live run. Add a settings toggle for the default + a Shift+Cmd+Enter (macOS) / Shift+Ctrl+Enter (Windows/Linux) one-message override. Tracked by the Dinocode Codex-Monitor parity audit (docs/codex-monitor-parity-audit.md).

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this parity feature is a **t3code feature**, not a Dinocode feature. The Dinocode direction is to keep t3code internals pristine and layer Dinocode features as packages. Three options for this bean:

1. **Upstream it** — open a PR against `pingdotgg/t3code` instead of committing inline here.
2. **Defer** — park until we decide the feature matters enough to accept the fork-internal change.
3. **Drop** — scrap if the feature isn't critical.

Default is option 1 (upstream). Update before starting work.
