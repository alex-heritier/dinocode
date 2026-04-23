---
# dinocode-q22h
title: Codex-Monitor reference parity audit
status: completed
type: task
priority: low
tags:
    - research
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-23T03:19:57Z
parent: dinocode-xd5m
---

Cross-reference CodexMonitor (per AGENTS.md) for UX details in diff/review and session recovery we haven't yet adopted.

## Subtasks

- [ ] Enumerate CodexMonitor features not yet in t3code/Dinocode
- [ ] Identify which belong in Dinocode (vs generic t3code concerns)
- [ ] File sub-tasks under appropriate epics for the ones we want
- [ ] Document out-of-scope features with rationale in DINOCODE.md



## Resolution

Full parity matrix lives at `docs/codex-monitor-parity-audit.md`.

- 18 Parity rows (already shipped)
- 1 Planned row (home agent, tracked by dinocode-nqra)
- 8 Gap rows — filed as follow-up beans: dinocode-50yd, dinocode-ewuu, dinocode-j9i1, dinocode-8p7z, dinocode-90rk, dinocode-94q9, dinocode-57a1, dinocode-d1ot
- 6 Out-of-scope rows with explicit rationale (dictation, Tailscale UI, iOS, vibrancy/reduced transparency, in-app updater, responsive mobile layouts)

Document also sets a re-audit trigger policy.
