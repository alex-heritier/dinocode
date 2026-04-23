---
# dinocode-sdqj
title: 'Browser: navigation allowlist + confirm-on-unknown security model'
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

Define and implement the security boundary that protects users from an agent wandering to arbitrary origins.

## Policy

- **Default allowlist per workspace**: `localhost`, `127.0.0.1`, `::1`, `*.local`, plus any origins listed in `.dinocode/config.yml → browser.allowedOrigins`.
- **Agent-initiated navigation** outside the allowlist → tool returns `NAVIGATION_BLOCKED`; tab does not change.
- **User-initiated navigation** outside the allowlist → modal confirm "This project's agent has not been granted access to <origin>. Allow once / Always allow / Cancel".
- **Explicit deny-list** for common credential-phishing / third-party-auth origins users typically don't want the agent touching.
- Allowlist state persists per project under `.dinocode/browser/allowlist.json` (workspace-scoped, not user-global).

## Acceptance

- Pure logic module (`Allowlist.ts`) with exhaustive unit tests.
- Agent tool handlers wrap `navigate`/`open` in an allowlist check before calling into main.
- Settings UI (later bean) surfaces the allowlist for edit.
